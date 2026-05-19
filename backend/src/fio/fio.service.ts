import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventarioMovimientoService } from '../inventario-movimiento/inventario-movimiento.service';
import { SriService } from '../sri/sri.service';
import { TipoMovimiento, EstadoFio, EstadoSRI, Prisma } from '@prisma/client';
import { PagarFioDto } from './dto/pagar-fio.dto';
import { CreateFioDto } from './dto/create-fio.dto';
import { UpdateFioDto } from './dto/update-fio.dto';
import { QueryFioDto } from './dto/query-fio.dto';

type FioConClienteDetalles = Prisma.FioGetPayload<{
  include: {
    cliente: true;
    detalles: { include: { producto: true } };
  };
}>;

@Injectable()
export class FioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventarioMovimientoService: InventarioMovimientoService,
    private readonly sriService: SriService,
  ) {}

  // ==========================
  // OBTENER UN FIO
  // ==========================
  async findOne(id: number) {
    const fio = await this.prisma.fio.findUnique({
      where: { id },
      include: {
        cliente: true,
        factura: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!fio) {
      throw new BadRequestException('Fío no encontrado');
    }

    return fio;
  }

  // ==========================
  // CREAR FIO
  // ==========================
  async create(dto: CreateFioDto) {
    const { clienteId, detalles } = dto;

    return this.prisma.$transaction(async (tx) => {
      let total = 0;

      interface DetalleProcesado {
        productoId: number;
        cantidad: number;
        precio: number;
        subtotal: number;
      }

      const detallesProcesados: DetalleProcesado[] = [];

      // VALIDACIONES + CÁLCULO
      for (const item of detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto) {
          throw new BadRequestException(
            `Producto ${item.productoId} no existe`,
          );
        }

        if (producto.stock < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto.nombre}`,
          );
        }

        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        detallesProcesados.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal,
        });
      }

      // CREAR FIO
      const fio = await tx.fio.create({
        data: {
          clienteId,
          total,
          estado: EstadoFio.PENDIENTE,
        },
      });

      // DETALLES + STOCK + KARDEX
      for (const item of detallesProcesados) {
        // detalle
        await tx.detalleFio.create({
          data: {
            fioId: fio.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.subtotal,
          },
        });

        // bajar stock
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        });

        // movimiento inventario (KARDEX)
        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: item.productoId,
          tipo: TipoMovimiento.SALIDA,
          cantidad: item.cantidad,
          referencia: `FIO-${fio.id}`,
          refId: fio.id,
          // costoUnitario se calcula desde el último kardex (promedio ponderado vigente)
        });
      }

      return fio;
    });
  }

  // ==========================
  // PAGAR FIO
  // ==========================
  async pagar(dto: PagarFioDto) {
    const { fioId, monto } = dto;

    // Paso 1: procesar pago en transacción
    const { nuevoEstado, fioCompleto } = await this.prisma.$transaction(
      async (tx) => {
        const fio = await tx.fio.findUnique({
          where: { id: fioId },
          include: {
            cliente: true,
            detalles: { include: { producto: true } },
          },
        });

        if (!fio) {
          throw new BadRequestException('Fio no existe');
        }

        if (fio.estado === EstadoFio.PAGADO) {
          throw new BadRequestException('El FIO ya está pagado');
        }

        if (monto <= 0) {
          throw new BadRequestException('El monto debe ser mayor a 0');
        }

        // total pagado actual
        const pagosActuales = await tx.pagoFio.aggregate({
          where: { fioId },
          _sum: { monto: true },
        });

        const totalActual = pagosActuales._sum.monto ?? 0;

        // validar exceso de pago
        if (totalActual + monto > fio.total) {
          throw new BadRequestException('El pago excede el total del FIO');
        }

        // registrar pago
        await tx.pagoFio.create({
          data: { fioId, monto },
        });

        const nuevoTotal = totalActual + monto;
        const nuevoEstado =
          nuevoTotal >= fio.total ? EstadoFio.PAGADO : EstadoFio.PARCIAL;

        await tx.fio.update({
          where: { id: fioId },
          data: { estado: nuevoEstado },
        });

        return { nuevoEstado, fioCompleto: fio };
      },
    );

    // Paso 2: si FIO queda PAGADO y cliente quiere factura electrónica, emitirla
    if (nuevoEstado === EstadoFio.PAGADO && dto.emitirFactura === true) {
      try {
        await this.emitirFacturaFio(fioCompleto, new Date());
      } catch (err) {
        // No revertir el pago, solo logear el error de facturación
        console.error(`[FIO] Error al emitir factura para FIO #${fioId}:`, err);
      }
    }

    return { message: 'Pago registrado correctamente', estado: nuevoEstado };
  }

  // ==========================
  // EMITIR FACTURA SRI PARA FIO
  // ==========================
  private async emitirFacturaFio(fio: FioConClienteDetalles, fechaPago?: Date) {
    const estab = (process.env.SRI_ESTAB || '001').padStart(3, '0');
    const ptoEmi = (process.env.SRI_PTO_EMI || '001').padStart(3, '0');
    const ambiente = process.env.SRI_AMBIENTE === '2' ? '2' : '1';
    // Usar un offset para no colisionar con secuenciales de ventas: FIO prefix en referencia
    const secuencial = String(fio.id + 500000).padStart(9, '0');
    const numeroFactura = `${estab}-${ptoEmi}-${secuencial}`;
    const ruc = process.env.SRI_RUC || process.env.EMPRESA_RUC;

    if (!ruc) {
      throw new Error('Falta SRI_RUC en variables de entorno');
    }

    // Verificar que no exista ya factura para este FIO
    const existente = await this.prisma.factura.findUnique({
      where: { fioId: fio.id },
    });
    if (existente) return;

    // Usar fecha de pago (si se proporciona) en lugar de fecha de creación del FIO
    const fechaEmision = fechaPago ?? fio.fecha;

    const claveAcceso = this.sriService.generarClaveAcceso({
      fechaEmision: fechaEmision,
      tipoComprobante: '01',
      ruc: String(ruc),
      ambiente,
      estab,
      ptoEmi,
      secuencial,
      codigoNumerico: String(fio.id + 500000).padStart(8, '0'),
      tipoEmision: '1',
    });

    // Registrar factura inicial
    await this.prisma.factura.create({
      data: {
        fioId: fio.id,
        numero: numeroFactura,
        claveAcceso,
        estadoSRI: EstadoSRI.GENERADA,
      },
    });

    // Construir venta-like para el generador de XML (reutiliza estructura)
    const ventaFio = {
      ...fio,
      id: fio.id,
      fecha: fechaEmision,
      total: fio.total,
      cliente: fio.cliente,
      detalles: fio.detalles.map((d) => ({
        ...d,
        producto: d.producto,
      })),
    };

    const enviarASri =
      (process.env.SRI_ENVIAR_AUTOMATICO || 'false').toLowerCase() === 'true';

    let xmlFirmado = '';
    let estadoSRI: EstadoSRI = EstadoSRI.GENERADA;
    let xmlAutorizado: string | null = null;
    let numeroAutorizacion: string | null = null;
    let fechaAutorizacion: Date | null = null;

    try {
      const xml = this.sriService.generarXMLFactura({
        venta: ventaFio,
        factura: {
          claveAcceso,
          estab,
          ptoEmi,
          secuencial,
          ambiente,
          tipoEmision: '1',
        },
        emisor: {
          ruc: String(ruc),
          razonSocial:
            process.env.SRI_RAZON_SOCIAL ||
            process.env.EMPRESA_NOMBRE ||
            'VIVERES LUPITA',
          nombreComercial:
            process.env.SRI_NOMBRE_COMERCIAL ||
            process.env.EMPRESA_NOMBRE_COMERCIAL ||
            'VIVERES LUPITA',
          dirMatriz: process.env.SRI_DIR_MATRIZ || 'DIRECCION MATRIZ',
          dirEstablecimiento:
            process.env.SRI_DIR_ESTABLECIMIENTO ||
            process.env.SRI_DIR_MATRIZ ||
            'DIRECCION',
        },
      });

      xmlFirmado = this.sriService.firmarXML(xml);

      const resultadoSri = await this.sriService.procesarComprobante({
        claveAcceso,
        xmlSinFirmar: xml,
        xmlFirmado,
        enviarASri,
      });

      estadoSRI = this.mapearEstadoSRI(resultadoSri.estado);
      xmlAutorizado = resultadoSri.xmlAutorizado || null;
      numeroAutorizacion = resultadoSri.numeroAutorizacion || null;
      fechaAutorizacion = resultadoSri.fechaAutorizacion
        ? new Date(resultadoSri.fechaAutorizacion)
        : null;
    } catch (err) {
      estadoSRI = EstadoSRI.RECHAZADA;
      xmlAutorizado = `<error>${err instanceof Error ? err.message : 'Error desconocido'}</error>`;
    }

    await this.prisma.factura.update({
      where: { fioId: fio.id },
      data: {
        estadoSRI,
        xmlGenerado: xmlFirmado || null,
        xmlAutorizado,
        numeroAutorizacion,
        fechaAutorizacion,
      },
    });
  }

  private mapearEstadoSRI(estado: string): EstadoSRI {
    const upper = (estado || '').toUpperCase().trim();
    if (upper === 'AUTORIZADO' || upper === 'AUTORIZADA') {
      return EstadoSRI.AUTORIZADA;
    }

    if (
      upper === 'RECIBIDA' ||
      upper === 'EN_PROCESO' ||
      upper === 'SIN_RESPUESTA_AUTORIZACION' ||
      upper === 'PENDIENTE_ENVIO'
    ) {
      return EstadoSRI.GENERADA;
    }

    if (
      upper === 'RECHAZADO' ||
      upper === 'RECHAZADA' ||
      upper === 'NO AUTORIZADO' ||
      upper === 'DEVUELTA' ||
      upper === 'DEVUELTO' ||
      upper === 'ERROR'
    ) {
      return EstadoSRI.RECHAZADA;
    }
    if (upper === 'ANULADO' || upper === 'ANULADA') {
      return EstadoSRI.ANULADA;
    }
    return EstadoSRI.RECHAZADA;
  }

  // ==========================
  // LISTAR FIOS
  // ==========================
  async findAll(query: QueryFioDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.FioWhereInput = {};

    if (query.search) {
      where.cliente = {
        nombre: {
          contains: query.search,
          mode: 'insensitive',
        },
      };
    }

    if (query.estado) {
      const estadoQuery = query.estado as EstadoFio;
      if (Object.values(EstadoFio).includes(estadoQuery)) {
        where.estado = estadoQuery;
      }
    }

    const orderBy = query.orderBy ?? 'fecha';
    const order = query.order ?? 'desc';
    const allowedOrderBy: Array<keyof Prisma.FioOrderByWithRelationInput> = [
      'id',
      'fecha',
      'total',
      'estado',
      'clienteId',
    ];
    const orderByField = allowedOrderBy.includes(
      orderBy as keyof Prisma.FioOrderByWithRelationInput,
    )
      ? (orderBy as keyof Prisma.FioOrderByWithRelationInput)
      : 'fecha';
    const orderDirection: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.fio.findMany({
        where,
        include: {
          cliente: true,
          factura: true,
          detalles: {
            include: {
              producto: true,
            },
          },
          pagos: true,
        },
        skip,
        take: limit,
        orderBy: {
          [orderByField]: orderDirection,
        } as Prisma.FioOrderByWithRelationInput,
      }),
      this.prisma.fio.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // ==========================
  // ACTUALIZAR FIO
  // ==========================
  async update(id: number, data: UpdateFioDto) {
    const fio = await this.prisma.fio.findUnique({
      where: { id },
    });

    if (!fio) {
      throw new BadRequestException('Fío no encontrado');
    }

    if (data.detalles) {
      throw new BadRequestException(
        'La actualización de detalles debe realizarse desde el flujo de anulación/creación',
      );
    }

    const updateData: Prisma.FioUncheckedUpdateInput = {};

    if (typeof data.clienteId === 'number') {
      updateData.clienteId = data.clienteId;
    }

    return this.prisma.fio.update({
      where: { id },
      data: updateData,
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true,
          },
        },
        pagos: true,
      },
    });
  }

  // ==========================
  // ELIMINAR FIO
  // ==========================
  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const fio = await tx.fio.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!fio) {
        throw new BadRequestException('Fío no encontrado');
      }

      if (fio.estado === EstadoFio.PAGADO) {
        throw new BadRequestException('No se puede eliminar un Fío ya pagado');
      }

      // Restaurar stock y kardex por cada detalle
      for (const detalle of fio.detalles) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { increment: detalle.cantidad } },
        });

        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: detalle.productoId,
          tipo: TipoMovimiento.ENTRADA,
          cantidad: detalle.cantidad,
          referencia: `ANULACION-FIO-${fio.id}`,
          refId: fio.id,
        });
      }

      return tx.fio.delete({ where: { id } });
    });
  }
}
