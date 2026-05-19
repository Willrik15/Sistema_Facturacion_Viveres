import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, TipoMovimiento } from '@prisma/client';

@Injectable()
export class InventarioMovimientoService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los movimientos
  async findAll() {
    return this.prisma.inventarioMovimiento.findMany({
      include: {
        producto: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  // Filtrar por producto
  async findByProducto(productoId: number) {
    return this.prisma.inventarioMovimiento.findMany({
      where: {
        productoId,
      },
      include: {
        producto: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
  }

  //Crear movimiento NORMAL (fuera de transacción)
  async crearMovimiento(data: {
    productoId: number;
    tipo: TipoMovimiento;
    cantidad: number;
  }) {
    return this.prisma.inventarioMovimiento.create({
      data: {
        productoId: data.productoId,
        tipo: data.tipo,
        cantidad: data.cantidad,
      },
    });
  }

  // Crear movimiento DENTRO de transacción
  async crearMovimientoTx(
    tx: Prisma.TransactionClient,
    data: {
      productoId: number;
      tipo: TipoMovimiento;
      cantidad: number;
      referencia?: string;
      refId?: number;
      costoUnitario?: number; // costo del movimiento actual (para entradas)
    },
  ) {
    // Obtener último movimiento (usar id desc como desempate cuando misma fecha)
    const ultimoMovimiento = await tx.inventarioMovimiento.findFirst({
      where: { productoId: data.productoId },
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
    });

    const saldoAnterior = ultimoMovimiento?.saldo ?? 0;
    const costoAnterior: number = ultimoMovimiento?.costoUnitario ?? 0;

    // Calcular saldo y costo promedio ponderado
    let nuevoSaldo = saldoAnterior;
    let nuevoCostoUnitario = costoAnterior;

    if (data.tipo === 'ENTRADA') {
      nuevoSaldo += data.cantidad;
      const costoEntrada = data.costoUnitario ?? 0;
      // Promedio ponderado = (saldo_ant * costo_ant + cant_nueva * costo_nuevo) / saldo_nuevo
      if (nuevoSaldo > 0) {
        nuevoCostoUnitario =
          (saldoAnterior * costoAnterior + data.cantidad * costoEntrada) /
          nuevoSaldo;
      } else {
        nuevoCostoUnitario = costoEntrada;
      }
    } else if (data.tipo === 'SALIDA') {
      nuevoSaldo -= data.cantidad;
      // En salida el costo unitario se mantiene (promedio vigente)
      nuevoCostoUnitario = costoAnterior;
    } else {
      // AJUSTE
      nuevoSaldo += data.cantidad;
      nuevoCostoUnitario = costoAnterior;
    }

    const nuevoCostoTotal = nuevoSaldo * nuevoCostoUnitario;

    // Crear movimiento
    return tx.inventarioMovimiento.create({
      data: {
        productoId: data.productoId,
        tipo: data.tipo,
        cantidad: data.cantidad,
        saldo: nuevoSaldo,
        costoUnitario: nuevoCostoUnitario,
        costoTotal: nuevoCostoTotal,
        referencia: data.referencia,
        refId: data.refId,
      },
    });
  }

  // Crear ajuste manual con motivo (actualiza stock del producto)
  async crearAjuste(data: {
    productoId: number;
    tipo: TipoMovimiento;
    cantidad: number;
    motivo: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const producto = await tx.producto.findUnique({
        where: { id: data.productoId },
      });

      if (!producto) {
        throw new BadRequestException('Producto no encontrado');
      }

      if (data.cantidad <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a 0');
      }

      // Actualizar stock
      let stockIncremento = 0;
      if (data.tipo === 'ENTRADA') stockIncremento = data.cantidad;
      if (data.tipo === 'SALIDA') stockIncremento = -data.cantidad;
      // AJUSTE: se registra pero no modifica stock automáticamente (es una corrección de saldo)

      if (data.tipo === 'SALIDA' && producto.stock < data.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Stock actual: ${producto.stock}`,
        );
      }

      if (stockIncremento !== 0) {
        await tx.producto.update({
          where: { id: data.productoId },
          data: { stock: { increment: stockIncremento } },
        });
      }

      return this.crearMovimientoTx(tx, {
        productoId: data.productoId,
        tipo: data.tipo,
        cantidad: data.cantidad,
        referencia: `AJUSTE: ${data.motivo}`,
      });
    });
  }
}
