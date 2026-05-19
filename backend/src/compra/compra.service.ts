import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { QueryCompraDto } from './dto/query-compra.dto';
import { TipoMovimiento } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { InventarioMovimientoService } from '../inventario-movimiento/inventario-movimiento.service';

@Injectable()
export class CompraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventarioMovimientoService: InventarioMovimientoService,
  ) {}

  // ==========================
  // CREAR COMPRA
  // ==========================
  async create(dto: CreateCompraDto) {
    const { proveedorId, usuarioId, detalles } = dto;
    const safeUsuarioId = usuarioId as number;
    const defaultMarginPercent = Number(
      process.env.DEFAULT_PRODUCT_MARGIN_PERCENT ?? 25,
    );

    return this.prisma.$transaction(async (tx) => {
      const proveedorGeneral = await tx.proveedor.upsert({
        where: { ruc: '0000000000000' },
        update: {},
        create: {
          nombre: 'PROVEEDOR GENERAL',
          ruc: '0000000000000',
          telefono: '0000000000',
        },
      });

      const proveedorIdFinal = proveedorId ?? proveedorGeneral.id;

      let total = 0;

      interface DetalleProcesado {
        productoId: number;
        cantidad: number;
        costoUnitario: number;
        subtotal: number;
      }

      const detallesProcesados: DetalleProcesado[] = [];

      // ==========================
      // VALIDAR Y CALCULAR
      // ==========================
      for (const item of detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto) {
          throw new BadRequestException(
            `Producto con ID ${item.productoId} no existe`,
          );
        }

        const subtotal = item.costoUnitario * item.cantidad;
        total += subtotal;

        detallesProcesados.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario,
          subtotal,
        });
      }

      // ==========================
      // CREAR COMPRA
      // ==========================
      const compra = await tx.compra.create({
        data: {
          proveedorId: proveedorIdFinal,
          usuarioId: safeUsuarioId,
          total,
        },
      });

      // ==========================
      // DETALLES + STOCK + KARDEX
      // ==========================
      for (const item of detallesProcesados) {
        // Crear detalle
        await tx.detalleCompra.create({
          data: {
            compraId: compra.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            costoUnitario: item.costoUnitario,
            subtotal: item.subtotal,
          },
        });

        // Actualizar stock
        const productoActualizado = await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              increment: item.cantidad,
            },
          },
        });

        // Registrar movimiento (KARDEX) con costo para promedio ponderado
        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: item.productoId,
          tipo: TipoMovimiento.ENTRADA,
          cantidad: item.cantidad,
          referencia: `COMPRA-${compra.id}`,
          refId: compra.id,
          costoUnitario: item.costoUnitario,
        });

        // Ajusta el precio de venta usando margen porcentual sobre el costo de compra.
        const margen =
          Number.isFinite(productoActualizado.margenGanancia) &&
          productoActualizado.margenGanancia >= 0
            ? productoActualizado.margenGanancia
            : defaultMarginPercent;

        const nuevoPrecio = Number(
          (item.costoUnitario * (1 + margen / 100)).toFixed(2),
        );

        await tx.producto.update({
          where: { id: item.productoId },
          data: { precio: nuevoPrecio },
        });
      }

      return compra;
    });
  }

  // ==========================
  // LISTAR COMPRAS
  // ==========================
  async findAll(query: QueryCompraDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    return this.prisma.compra.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        proveedor: true,
        usuario: true,
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
  // OBTENER UNA COMPRA
  // ==========================
  async findOne(id: number) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
      include: {
        proveedor: true,
        usuario: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!compra) {
      throw new BadRequestException('Compra no encontrada');
    }

    return compra;
  }

  // ==========================
  // ANULAR COMPRA
  // ==========================
  async anular(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const compra = await tx.compra.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!compra) {
        throw new BadRequestException('Compra no encontrada');
      }

      if (compra.estado === 'ANULADA') {
        throw new BadRequestException('La compra ya está anulada');
      }

      for (const detalle of compra.detalles) {
        const producto = await tx.producto.findUnique({
          where: { id: detalle.productoId },
        });

        if (!producto) {
          throw new BadRequestException(
            `Producto con ID ${detalle.productoId} no existe`,
          );
        }

        // 🔥 VALIDACIÓN CLAVE
        if (producto.stock < detalle.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para anular producto ID ${detalle.productoId}`,
          );
        }

        const nuevoStock = producto.stock - detalle.cantidad;

        // Actualizar stock
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: {
            stock: nuevoStock,
          },
        });

        // Registrar movimiento (KARDEX)
        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: detalle.productoId,
          tipo: TipoMovimiento.SALIDA,
          cantidad: detalle.cantidad,
          referencia: `COMPRA-ANULADA-${compra.id}`,
          refId: compra.id,
        });
      }

      // Cambiar estado
      return tx.compra.update({
        where: { id },
        data: { estado: 'ANULADA' },
      });
    });
  }

  // ==========================
  // ACTUALIZAR COMPRA
  // ==========================
  async update(id: number, data: UpdateCompraDto) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
    });

    if (!compra) {
      throw new BadRequestException('Compra no encontrada');
    }

    if (data.detalles) {
      throw new BadRequestException(
        'La actualización de detalles debe realizarse desde el flujo de anulación/creación',
      );
    }

    const updateData: Prisma.CompraUncheckedUpdateInput = {};

    if (typeof data.proveedorId === 'number') {
      updateData.proveedorId = data.proveedorId;
    }

    if (typeof data.usuarioId === 'number') {
      updateData.usuarioId = data.usuarioId;
    }

    return this.prisma.compra.update({
      where: { id },
      data: updateData,
      include: {
        proveedor: true,
        usuario: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });
  }

  // ==========================
  // ELIMINAR COMPRA
  // ==========================
  async remove(id: number) {
    const compra = await this.prisma.compra.findUnique({
      where: { id },
    });

    if (!compra) {
      throw new BadRequestException('Compra no encontrada');
    }

    return this.prisma.compra.delete({
      where: { id },
    });
  }
}
