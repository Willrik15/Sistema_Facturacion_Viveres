import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventarioMovimientoService } from '../inventario-movimiento/inventario-movimiento.service';
import { TipoMovimiento } from '@prisma/client';
import { CreateConsumoDto } from './dto/create-consumo.dto';
import { UpdateConsumoDto } from './dto/update-consumo.dto';
import { QueryConsumoDto } from './dto/query-consumo.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ConsumoInternoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventarioMovimientoService: InventarioMovimientoService,
  ) {}

  // ==========================
  // CREAR CONSUMO
  // ==========================
  async create(dto: CreateConsumoDto) {
    const { usuarioId, motivo, detalles } = dto;
    const safeUsuarioId = usuarioId as number;

    return this.prisma.$transaction(async (tx) => {
      // VALIDAR PRODUCTOS
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
      }

      // CREAR CONSUMO
      const consumo = await tx.consumoInterno.create({
        data: {
          usuarioId: safeUsuarioId,
          motivo,
        },
      });

      // DETALLES + STOCK + KARDEX
      for (const item of detalles) {
        // crear detalle
        await tx.detalleConsumo.create({
          data: {
            consumoId: consumo.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
          },
        });

        // actualizar stock
        await tx.producto.update({
          where: { id: item.productoId },
          data: {
            stock: {
              decrement: item.cantidad,
            },
          },
        });

        // KARDEX
        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: item.productoId,
          tipo: TipoMovimiento.SALIDA,
          cantidad: item.cantidad,
          referencia: `CONSUMO-${consumo.id}`,
          refId: consumo.id,
          // costoUnitario se calcula desde el último kardex (promedio ponderado vigente)
        });
      }

      return consumo;
    });
  }

  // ==========================
  // LISTAR
  // ==========================
  async findAll(query: QueryConsumoDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ConsumoInternoWhereInput = {};

    if (query.search) {
      where.motivo = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const orderBy = query.orderBy ?? 'fecha';
    const order = query.order ?? 'desc';
    const allowedOrderBy: Array<
      keyof Prisma.ConsumoInternoOrderByWithRelationInput
    > = ['id', 'fecha', 'motivo', 'usuarioId'];
    const orderByField = allowedOrderBy.includes(
      orderBy as keyof Prisma.ConsumoInternoOrderByWithRelationInput,
    )
      ? (orderBy as keyof Prisma.ConsumoInternoOrderByWithRelationInput)
      : 'fecha';
    const orderDirection: Prisma.SortOrder = order === 'asc' ? 'asc' : 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.consumoInterno.findMany({
        where,
        include: {
          usuario: true,
          detalles: {
            include: {
              producto: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          [orderByField]: orderDirection,
        } as Prisma.ConsumoInternoOrderByWithRelationInput,
      }),
      this.prisma.consumoInterno.count({ where }),
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
  // OBTENER UNO
  // ==========================
  async findOne(id: number) {
    const consumo = await this.prisma.consumoInterno.findUnique({
      where: { id },
      include: {
        usuario: true,
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    if (!consumo) {
      throw new BadRequestException('Consumo no encontrado');
    }

    return consumo;
  }

  // ==========================
  // ACTUALIZAR CONSUMO
  // ==========================
  async update(id: number, data: UpdateConsumoDto) {
    const consumo = await this.prisma.consumoInterno.findUnique({
      where: { id },
    });

    if (!consumo) {
      throw new BadRequestException('Consumo no encontrado');
    }

    if (data.detalles) {
      throw new BadRequestException(
        'La actualización de detalles debe realizarse desde el flujo de anulación/creación',
      );
    }

    const updateData: Prisma.ConsumoInternoUncheckedUpdateInput = {};

    if (typeof data.motivo === 'string') {
      updateData.motivo = data.motivo;
    }

    if (typeof data.usuarioId === 'number') {
      updateData.usuarioId = data.usuarioId;
    }

    return this.prisma.consumoInterno.update({
      where: { id },
      data: updateData,
      include: {
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
  // ELIMINAR CONSUMO
  // ==========================
  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const consumo = await tx.consumoInterno.findUnique({
        where: { id },
        include: { detalles: true },
      });

      if (!consumo) {
        throw new BadRequestException('Consumo no encontrado');
      }

      // Restaurar stock y kardex por cada detalle
      for (const detalle of consumo.detalles) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { increment: detalle.cantidad } },
        });

        await this.inventarioMovimientoService.crearMovimientoTx(tx, {
          productoId: detalle.productoId,
          tipo: TipoMovimiento.ENTRADA,
          cantidad: detalle.cantidad,
          referencia: `ANULACION-CONSUMO-${consumo.id}`,
          refId: consumo.id,
        });
      }

      return tx.consumoInterno.delete({ where: { id } });
    });
  }
}
