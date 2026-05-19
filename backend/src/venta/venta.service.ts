import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { EstadoVenta, TipoMovimiento, EstadoSRI } from '@prisma/client';
import { InventarioMovimientoService } from '../inventario-movimiento/inventario-movimiento.service';
import { JwtUser } from '../auth/interfaces/jwt-payload.interface';
import { SriService } from '../sri/sri.service';
import { MailService } from '../mail/mail.service';
import { Prisma } from '@prisma/client';

interface DetalleProcesado {
  productoId: number;
  cantidad: number;
  subtotal: number;
}

@Injectable()
export class VentaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventarioMovimientoService: InventarioMovimientoService,
    private readonly sriService: SriService,
    private readonly mailService: MailService,
  ) {}

  // ==========================
  // CREAR VENTA
  // ==========================
  async create(dto: CreateVentaDto, user: JwtUser) {
    const { clienteId, detalles } = dto;
    const usuarioId = user.id;

    const resultadoVenta = await this.prisma.$transaction(async (tx) => {
      let total = 0;
      const detallesProcesados: DetalleProcesado[] = [];

      // VALIDAR PRODUCTOS
      for (const item of detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto) {
          throw new BadRequestException('Producto no existe');
        }

        if (producto.stock < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto.nombre}`,
          );
        }

        const subtotal = producto.precio * item.cantidad;
        total += subtotal;

        detallesProcesados.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
          subtotal,
        });
      }

      // VALIDAR CLIENTE Y USUARIO
      const clienteExiste = await tx.cliente.findUnique({
        where: { id: clienteId },
      });
      if (!clienteExiste) {
        throw new BadRequestException(
          `Cliente con id ${clienteId} no encontrado`,
        );
      }

      const usuarioExiste = await tx.usuario.findUnique({
        where: { id: usuarioId },
      });
      if (!usuarioExiste) {
        throw new BadRequestException(
          `Usuario con id ${usuarioId} no encontrado. Por favor cierra sesión e inicia de nuevo.`,
        );
      }

      // CREAR VENTA
      const venta = await tx.venta.create({
        data: {
          clienteId,
          usuarioId,
          total,
        },
      });

      // FACTURA
      const estab = (process.env.SRI_ESTAB || '001').padStart(3, '0');
      const ptoEmi = (process.env.SRI_PTO_EMI || '001').padStart(3, '0');
      const ambiente = process.env.SRI_AMBIENTE === '2' ? '2' : '1';
      const secuencial = String(venta.id).padStart(9, '0');
      const numeroFactura = `${estab}-${ptoEmi}-${secuencial}`;
      const ruc = process.env.SRI_RUC || process.env.EMPRESA_RUC;

      if (!ruc) {
        throw new BadRequestException(
          'Falta configurar SRI_RUC o EMPRESA_RUC en variables de entorno',
        );
      }

      const claveAcceso = this.sriService.generarClaveAcceso({
        fechaEmision: venta.fecha,
        tipoComprobante: '01',
        ruc: String(ruc),
        ambiente,
        estab,
        ptoEmi,
        secuencial,
        codigoNumerico: String(venta.id).padStart(8, '0'),
        tipoEmision: '1',
      });

      await tx.factura.create({
        data: {
          ventaId: venta.id,
          numero: numeroFactura,
          claveAcceso,
          estadoSRI: EstadoSRI.GENERADA,
        },
      });

      // DETALLES + STOCK + KARDEX
      for (const item of detallesProcesados) {
        await tx.detalleVenta.create({
          data: {
            ventaId: venta.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            subtotal: item.subtotal,
          },
        });

        // actualizar stock (decrement atómico, sin doble consulta)
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { decrement: item.cantidad } },
        });

        // KARDEX - salida por venta
        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: item.productoId,
          tipo: TipoMovimiento.SALIDA,
          cantidad: item.cantidad,
          referencia: `VENTA-${venta.id}`,
          refId: venta.id,
        });
      }

      // OBTENER VENTA COMPLETA
      const ventaCompleta = await tx.venta.findUnique({
        where: { id: venta.id },
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

      if (!ventaCompleta) {
        throw new BadRequestException('Error al obtener la venta completa');
      }

      return {
        ventaId: venta.id,
        claveAcceso,
        estab,
        ptoEmi,
        secuencial,
        ambiente,
        ventaCompleta,
      };
    });

    const enviarASri =
      (process.env.SRI_ENVIAR_AUTOMATICO || 'false').toLowerCase() === 'true';
    let xmlFirmado = '';
    let estadoSRI: EstadoSRI = EstadoSRI.GENERADA;
    let xmlAutorizado: string | null = null;
    let numeroAutorizacion: string | null = null;
    let fechaAutorizacion: Date | null = null;

    try {
      const xml = this.sriService.generarXMLFactura({
        venta: resultadoVenta.ventaCompleta,
        factura: {
          claveAcceso: resultadoVenta.claveAcceso,
          estab: resultadoVenta.estab,
          ptoEmi: resultadoVenta.ptoEmi,
          secuencial: resultadoVenta.secuencial,
          ambiente: resultadoVenta.ambiente,
          tipoEmision: '1',
        },
        emisor: {
          ruc: String(process.env.SRI_RUC || process.env.EMPRESA_RUC || ''),
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
        claveAcceso: resultadoVenta.claveAcceso,
        xmlSinFirmar: xml,
        xmlFirmado,
        enviarASri,
      });

      estadoSRI = this.mapearEstadoSRI(resultadoSri.estado);
      if (estadoSRI === EstadoSRI.RECHAZADA && resultadoSri.mensajes?.length) {
        xmlAutorizado = `<rechazoSRI><estado>${resultadoSri.estado}</estado><mensajes>${resultadoSri.mensajes.map((m) => `<mensaje><id>${m.identificador || ''}</id><texto>${m.mensaje}</texto><info>${m.informacionAdicional || ''}</info><tipo>${m.tipo || ''}</tipo></mensaje>`).join('')}</mensajes></rechazoSRI>`;
      } else {
        xmlAutorizado = resultadoSri.xmlAutorizado || null;
        if (resultadoSri.numeroAutorizacion) {
          numeroAutorizacion = resultadoSri.numeroAutorizacion;
        }
        if (resultadoSri.fechaAutorizacion) {
          fechaAutorizacion = new Date(resultadoSri.fechaAutorizacion);
        }
      }
    } catch (error) {
      estadoSRI = EstadoSRI.RECHAZADA;

      if (error instanceof BadRequestException) {
        const respuesta = error.getResponse();
        const mensaje =
          typeof respuesta === 'string' ? respuesta : JSON.stringify(respuesta);
        xmlAutorizado = `<error>${mensaje}</error>`;
      } else {
        xmlAutorizado = `<error>${error instanceof Error ? error.message : 'Error desconocido'}</error>`;
      }
    }

    await this.prisma.factura.update({
      where: { ventaId: resultadoVenta.ventaId },
      data: {
        estadoSRI,
        xmlGenerado: xmlFirmado || null,
        xmlAutorizado,
        numeroAutorizacion,
        fechaAutorizacion,
      },
    });

    const ventaActualizada = await this.prisma.venta.findUnique({
      where: { id: resultadoVenta.ventaId },
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

    if (!ventaActualizada) {
      throw new BadRequestException('No se pudo obtener la venta creada');
    }

    // Enviar factura por correo si el cliente tiene email
    if (ventaActualizada.cliente?.email) {
      const numeroFactura =
        ventaActualizada.factura?.numero ?? `VTA-${ventaActualizada.id}`;
      void this.mailService.enviarFactura({
        clienteEmail: ventaActualizada.cliente.email,
        clienteNombre: ventaActualizada.cliente.nombre,
        numeroFactura,
        fecha: ventaActualizada.fecha,
        total: ventaActualizada.total,
        detalles: ventaActualizada.detalles.map((d) => ({
          producto: d.producto.nombre,
          cantidad: d.cantidad,
          precio: d.subtotal / d.cantidad,
          subtotal: d.subtotal,
        })),
      });
    }

    return ventaActualizada;
  }

  // ==========================
  // ANULAR VENTA
  // ==========================
  async anular(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!venta) {
        throw new BadRequestException('Venta no encontrada');
      }

      if (venta.estado === EstadoVenta.ANULADA) {
        throw new BadRequestException('La venta ya está anulada');
      }

      for (const detalle of venta.detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: detalle.productoId },
        });

        if (!producto) {
          throw new BadRequestException('Producto no encontrado');
        }

        const nuevoStock = producto.stock + detalle.cantidad;

        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: nuevoStock },
        });

        // KARDEX
        // para anulaciones, el movimiento es una ENTRADA (devolución al inventario)
        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: detalle.productoId,
          tipo: TipoMovimiento.ENTRADA,
          cantidad: detalle.cantidad,
          referencia: `VENTA-ANULADA-${venta.id}`,
          refId: venta.id,
        });
      }

      return tx.venta.update({
        where: { id },
        data: { estado: EstadoVenta.ANULADA },
      });
    });
  }

  // ==========================
  // REPORTE FINANCIERO
  // ==========================
  async reporteFinanciero(fechaDesde?: string, fechaHasta?: string) {
    const where: Prisma.VentaWhereInput = {
      estado: EstadoVenta.ACTIVA,
    };

    if (fechaDesde && fechaHasta) {
      where.fecha = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta),
      };
    }

    const ventas = await this.prisma.venta.findMany({
      where,
      include: {
        cliente: true,
        usuario: true,
        detalles: {
          include: {
            producto: true,
          },
        },
        factura: true,
      },
      orderBy: { fecha: 'desc' },
    });

    const totalIngresos = ventas.reduce((acc, venta) => acc + venta.total, 0);

    return {
      totalVentas: ventas.length,
      totalIngresos,
      ventas,
    };
  }

  private mapearEstadoSRI(estado: string): EstadoSRI {
    const upper = (estado || '').toUpperCase().trim();
    if (upper === 'AUTORIZADO' || upper === 'AUTORIZADA') {
      return EstadoSRI.AUTORIZADA;
    }

    // Estados transitorios válidos del flujo SRI.
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

    // Cualquier estado desconocido se trata como rechazo para no ocultar errores.
    return EstadoSRI.RECHAZADA;
  }

  // ==========================
  // LISTAR
  // ==========================
  async findAll(user: JwtUser) {
    const where: Prisma.VentaWhereInput = {};

    return this.prisma.venta.findMany({
      where,
      include: {
        cliente: true,
        factura: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });
  }

  // ==========================
  // OBTENER UNA
  // ==========================
  async findOne(id: number, user: JwtUser) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        cliente: true,
        detalles: {
          include: { producto: true },
        },
      },
    });

    if (!venta) {
      throw new BadRequestException('Venta no existe');
    }

    return venta;
  }
}
