import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ClienteMasFrecuente,
  FlujoCaja,
  GananciaDiaria,
  GananciaProducto,
  LibroDiarioItem,
  ProductoMasVendido,
  ResumenPeriodo,
} from '../shared/types/reportes';

type MovimientoConFechaTotal = {
  fecha: Date;
  total: number;
};

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Construye el libro diario con ingresos y egresos ordenados por fecha.
   */
  async getLibroDiario(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<LibroDiarioItem[]> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    // Obtiene ventas activas en el rango.
    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
      include: {
        cliente: true,
        detalles: { include: { producto: true } },
      },
    });

    // Obtiene compras activas en el rango.
    const compras = await this.prisma.compra.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
      include: {
        proveedor: true,
        detalles: { include: { producto: true } },
      },
    });

    // Combina movimientos y ordena por fecha.
    const items: LibroDiarioItem[] = [
      ...ventas.map((v) => ({
        fecha: v.fecha,
        referencia: `VENTA-${v.id}`,
        descripcion: `Venta a ${v.cliente.nombre}`,
        tipo: 'INGRESO' as const,
        monto: v.total,
        refId: v.id,
        detalles: v.detalles.map((d) => ({
          producto: d.producto?.nombre ?? `#${d.productoId}`,
          cantidad: d.cantidad,
          precio: d.cantidad > 0 ? d.subtotal / d.cantidad : 0,
          subtotal: d.subtotal ?? 0,
        })),
      })),
      ...compras.map((c) => ({
        fecha: c.fecha,
        referencia: `COMPRA-${c.id}`,
        descripcion: `Compra a ${c.proveedor.nombre}`,
        tipo: 'EGRESO' as const,
        monto: c.total,
        refId: c.id,
        detalles: c.detalles.map((d) => ({
          producto: d.producto?.nombre ?? `#${d.productoId}`,
          cantidad: d.cantidad,
          precio: d.costoUnitario ?? 0,
          subtotal: d.subtotal ?? 0,
        })),
      })),
    ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

    // Calcula el saldo acumulado por movimiento.
    let saldoAcumulado = 0;
    items.forEach((item) => {
      saldoAcumulado += item.tipo === 'INGRESO' ? item.monto : -item.monto;
      item.saldo_acumulado = saldoAcumulado;
    });

    return items;
  }

  /**
   * 📊 RESUMEN DE VENTAS por período
   */
  async getResumenVentas(
    periodo?: 'diario' | 'mensual' | 'anual',
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<ResumenPeriodo[]> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
      include: {
        detalles: {
          include: { producto: true },
        },
      },
    });

    const totalIngresos = ventas.reduce((sum, v) => sum + v.total, 0);
    const ventasAgrupables: MovimientoConFechaTotal[] = ventas.map((v) => ({
      fecha: v.fecha,
      total: v.total,
    }));

    // Agrupa el resumen cuando se solicita periodo.
    if (periodo === 'diario') {
      return this._agruparDiario(ventasAgrupables);
    } else if (periodo === 'mensual') {
      return this._agruparMensual(ventasAgrupables);
    } else if (periodo === 'anual') {
      return this._agruparAnual(ventasAgrupables);
    }

    return [
      {
        periodo: 'Total',
        totalIngresos,
        totalEgresos: 0,
        neto: totalIngresos,
        transacciones: ventas.length,
      },
    ];
  }

  /**
   * 📊 RESUMEN DE COMPRAS por período
   */
  async getResumenCompras(
    periodo?: 'diario' | 'mensual' | 'anual',
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<ResumenPeriodo[]> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const compras = await this.prisma.compra.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
    });

    const totalEgresos = compras.reduce((sum, c) => sum + c.total, 0);
    const comprasAgrupables: MovimientoConFechaTotal[] = compras.map((c) => ({
      fecha: c.fecha,
      total: c.total,
    }));

    if (periodo === 'diario') {
      return this._agruparDiarioCompras(comprasAgrupables);
    } else if (periodo === 'mensual') {
      return this._agruparMensualCompras(comprasAgrupables);
    }

    return [
      {
        periodo: 'Total',
        totalIngresos: 0,
        totalEgresos,
        neto: -totalEgresos,
        transacciones: compras.length,
      },
    ];
  }

  /**
   * Calcula ingresos, egresos y neto del rango.
   */
  async getFlujoCaja(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<FlujoCaja> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
    });

    const compras = await this.prisma.compra.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
    });

    const ingresos = ventas.reduce((sum, v) => sum + v.total, 0);
    const egresos = compras.reduce((sum, c) => sum + c.total, 0);
    const neto = ingresos - egresos;

    return {
      periodo: `${desde.toLocaleDateString()} a ${hasta.toLocaleDateString()}`,
      ingresos,
      egresos,
      neto,
      margen: ingresos > 0 ? Number(((neto / ingresos) * 100).toFixed(2)) : 0,
      margenNeto: ingresos > 0 ? ((neto / ingresos) * 100).toFixed(2) : 0,
      ventasCount: ventas.length,
      comprasCount: compras.length,
    };
  }

  /**
   * Obtiene productos mas vendidos por ingreso total.
   */
  async getProductosMasVendidos(
    limite: number = 10,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<ProductoMasVendido[]> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
      include: {
        detalles: {
          include: { producto: true },
        },
      },
    });

    // Agrupa ventas por producto.
    const mapaProductos = new Map<
      number,
      { nombre: string; cantidad: number; ingreso: number }
    >();

    ventas.forEach((v) => {
      v.detalles.forEach((d) => {
        if (!mapaProductos.has(d.producto.id)) {
          mapaProductos.set(d.producto.id, {
            nombre: d.producto.nombre,
            cantidad: 0,
            ingreso: 0,
          });
        }
        const data = mapaProductos.get(d.producto.id)!;
        data.cantidad += d.cantidad;
        data.ingreso += d.subtotal;
      });
    });

    // Convierte a lista y ordena por ingreso.
    const totalIngreso = Array.from(mapaProductos.values()).reduce(
      (sum, p) => sum + p.ingreso,
      0,
    );

    return Array.from(mapaProductos.entries())
      .map(([id, data]) => ({
        id,
        nombre: data.nombre,
        cantidadVendida: data.cantidad,
        ingresoTotal: parseFloat(data.ingreso.toFixed(2)),
        porcentaje: parseFloat(
          ((data.ingreso / totalIngreso) * 100).toFixed(2),
        ),
      }))
      .sort((a, b) => b.ingresoTotal - a.ingresoTotal)
      .slice(0, limite);
  }

  /**
   * Obtiene clientes mas frecuentes por numero de compras.
   */
  async getClientesMasFrecuentes(
    limite: number = 10,
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<ClienteMasFrecuente[]> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
      include: { cliente: true },
    });

    const mapaClientes = new Map<
      number,
      { nombre: string; compras: number; totalGastado: number }
    >();

    ventas.forEach((v) => {
      if (!mapaClientes.has(v.cliente.id)) {
        mapaClientes.set(v.cliente.id, {
          nombre: v.cliente.nombre,
          compras: 0,
          totalGastado: 0,
        });
      }
      const data = mapaClientes.get(v.cliente.id)!;
      data.compras++;
      data.totalGastado += v.total;
    });

    const clientesOrdenados = Array.from(mapaClientes.entries()).sort(
      (a, b) => b[1].compras - a[1].compras,
    );

    const totalGastadoGeneral = clientesOrdenados.reduce(
      (sum, [, data]) => sum + data.totalGastado,
      0,
    );

    return clientesOrdenados.slice(0, limite).map(([id, data]) => ({
      id,
      nombre: data.nombre,
      transacciones: data.compras,
      totalComprado: Number(data.totalGastado.toFixed(2)),
      porcentaje:
        totalGastadoGeneral > 0
          ? Number(((data.totalGastado / totalGastadoGeneral) * 100).toFixed(2))
          : 0,
    }));
  }

  async getGananciaPorProducto(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<GananciaProducto[]> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const ventas = await this.prisma.venta.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        estado: 'ACTIVA',
      },
      include: {
        detalles: {
          include: {
            producto: true,
          },
        },
      },
    });

    const movimientosVenta = await this.prisma.inventarioMovimiento.findMany({
      where: {
        fecha: { gte: desde, lte: hasta },
        tipo: 'SALIDA',
        referencia: { startsWith: 'VENTA-' },
      },
      select: {
        refId: true,
        productoId: true,
        cantidad: true,
        costoUnitario: true,
      },
    });

    const costosPorVentaYProducto = new Map<string, number>();
    movimientosVenta.forEach((mov) => {
      const key = `${mov.refId}-${mov.productoId}`;
      const costoActual = costosPorVentaYProducto.get(key) ?? 0;
      costosPorVentaYProducto.set(
        key,
        costoActual + mov.cantidad * mov.costoUnitario,
      );
    });

    const acumulado = new Map<
      number,
      {
        producto: string;
        categoria?: string | null;
        unidadesVendidas: number;
        ingresos: number;
        costos: number;
      }
    >();

    ventas.forEach((venta) => {
      venta.detalles.forEach((detalle) => {
        const keyVenta = `${venta.id}-${detalle.productoId}`;
        const costoDetalle = costosPorVentaYProducto.get(keyVenta) ?? 0;

        if (!acumulado.has(detalle.productoId)) {
          acumulado.set(detalle.productoId, {
            producto: detalle.producto.nombre,
            categoria: detalle.producto.categoria,
            unidadesVendidas: 0,
            ingresos: 0,
            costos: 0,
          });
        }

        const item = acumulado.get(detalle.productoId)!;
        item.unidadesVendidas += detalle.cantidad;
        item.ingresos += detalle.subtotal;
        item.costos += costoDetalle;
      });
    });

    return Array.from(acumulado.entries())
      .map(([productoId, data]) => {
        const ganancia = data.ingresos - data.costos;
        const margenPorcentaje =
          data.ingresos > 0
            ? Number(((ganancia / data.ingresos) * 100).toFixed(2))
            : 0;

        return {
          productoId,
          producto: data.producto,
          categoria: data.categoria,
          unidadesVendidas: data.unidadesVendidas,
          ingresos: Number(data.ingresos.toFixed(2)),
          costos: Number(data.costos.toFixed(2)),
          ganancia: Number(ganancia.toFixed(2)),
          margenPorcentaje,
        };
      })
      .sort((a, b) => b.ganancia - a.ganancia);
  }

  async getGananciaDiaria(
    fechaDesde?: string,
    fechaHasta?: string,
  ): Promise<GananciaDiaria[]> {
    const desde = fechaDesde ? new Date(fechaDesde) : new Date('2026-01-01');
    const hasta = fechaHasta ? new Date(fechaHasta) : new Date();
    hasta.setHours(23, 59, 59, 999);

    const [ventas, pagosFio, compras, fios, consumosMovimiento] =
      await Promise.all([
        this.prisma.venta.findMany({
          where: { fecha: { gte: desde, lte: hasta }, estado: 'ACTIVA' },
          select: { fecha: true, total: true },
        }),
        this.prisma.pagoFio.findMany({
          where: { fecha: { gte: desde, lte: hasta } },
          select: { fecha: true, monto: true },
        }),
        this.prisma.compra.findMany({
          where: { fecha: { gte: desde, lte: hasta }, estado: 'ACTIVA' },
          select: { fecha: true, total: true },
        }),
        this.prisma.fio.findMany({
          where: { fecha: { gte: desde, lte: hasta } },
          select: { fecha: true, total: true },
        }),
        this.prisma.inventarioMovimiento.findMany({
          where: {
            fecha: { gte: desde, lte: hasta },
            tipo: 'SALIDA',
            referencia: { startsWith: 'CONSUMO-' },
          },
          select: { fecha: true, cantidad: true, costoUnitario: true },
        }),
      ]);

    const dias = new Map<string, GananciaDiaria>();

    const ensureDay = (fecha: Date): GananciaDiaria => {
      const key = fecha.toISOString().split('T')[0];
      if (!dias.has(key)) {
        dias.set(key, {
          fecha: key,
          ingresosVentas: 0,
          ingresosPagosFio: 0,
          egresosCompras: 0,
          egresosFios: 0,
          egresosConsumoInterno: 0,
          neto: 0,
        });
      }
      return dias.get(key)!;
    };

    ventas.forEach((v) => {
      const day = ensureDay(v.fecha);
      day.ingresosVentas += v.total;
    });

    pagosFio.forEach((p) => {
      const day = ensureDay(p.fecha);
      day.ingresosPagosFio += p.monto;
    });

    compras.forEach((c) => {
      const day = ensureDay(c.fecha);
      day.egresosCompras += c.total;
    });

    fios.forEach((f) => {
      const day = ensureDay(f.fecha);
      day.egresosFios += f.total;
    });

    consumosMovimiento.forEach((c) => {
      const day = ensureDay(c.fecha);
      day.egresosConsumoInterno += c.cantidad * c.costoUnitario;
    });

    return Array.from(dias.values())
      .map((d) => {
        const neto =
          d.ingresosVentas +
          d.ingresosPagosFio -
          d.egresosCompras -
          d.egresosFios -
          d.egresosConsumoInterno;

        return {
          ...d,
          ingresosVentas: Number(d.ingresosVentas.toFixed(2)),
          ingresosPagosFio: Number(d.ingresosPagosFio.toFixed(2)),
          egresosCompras: Number(d.egresosCompras.toFixed(2)),
          egresosFios: Number(d.egresosFios.toFixed(2)),
          egresosConsumoInterno: Number(d.egresosConsumoInterno.toFixed(2)),
          neto: Number(neto.toFixed(2)),
        };
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  // Metodos privados para agrupar datos.
  private _agruparDiario(ventas: MovimientoConFechaTotal[]): ResumenPeriodo[] {
    const dias = new Map<string, { ingresos: number; transacciones: number }>();
    ventas.forEach((v) => {
      const fecha = v.fecha.toISOString().split('T')[0];
      const actual = dias.get(fecha) || { ingresos: 0, transacciones: 0 };
      actual.ingresos += v.total;
      actual.transacciones += 1;
      dias.set(fecha, actual);
    });
    return Array.from(dias.entries()).map(([fecha, data]) => ({
      periodo: fecha,
      totalIngresos: data.ingresos,
      totalEgresos: 0,
      neto: data.ingresos,
      transacciones: data.transacciones,
    }));
  }

  private _agruparMensual(ventas: MovimientoConFechaTotal[]): ResumenPeriodo[] {
    const meses = new Map<
      string,
      { ingresos: number; transacciones: number }
    >();
    ventas.forEach((v) => {
      const mes = v.fecha.toISOString().substring(0, 7);
      const actual = meses.get(mes) || { ingresos: 0, transacciones: 0 };
      actual.ingresos += v.total;
      actual.transacciones += 1;
      meses.set(mes, actual);
    });
    return Array.from(meses.entries()).map(([mes, data]) => ({
      periodo: mes,
      totalIngresos: data.ingresos,
      totalEgresos: 0,
      neto: data.ingresos,
      transacciones: data.transacciones,
    }));
  }

  private _agruparAnual(ventas: MovimientoConFechaTotal[]): ResumenPeriodo[] {
    const años = new Map<string, { ingresos: number; transacciones: number }>();
    ventas.forEach((v) => {
      const año = v.fecha.toISOString().substring(0, 4);
      const actual = años.get(año) || { ingresos: 0, transacciones: 0 };
      actual.ingresos += v.total;
      actual.transacciones += 1;
      años.set(año, actual);
    });
    return Array.from(años.entries()).map(([año, data]) => ({
      periodo: año,
      totalIngresos: data.ingresos,
      totalEgresos: 0,
      neto: data.ingresos,
      transacciones: data.transacciones,
    }));
  }

  private _agruparDiarioCompras(
    compras: MovimientoConFechaTotal[],
  ): ResumenPeriodo[] {
    const dias = new Map<string, { egresos: number; transacciones: number }>();
    compras.forEach((c) => {
      const fecha = c.fecha.toISOString().split('T')[0];
      const actual = dias.get(fecha) || { egresos: 0, transacciones: 0 };
      actual.egresos += c.total;
      actual.transacciones += 1;
      dias.set(fecha, actual);
    });
    return Array.from(dias.entries()).map(([fecha, data]) => ({
      periodo: fecha,
      totalIngresos: 0,
      totalEgresos: data.egresos,
      neto: -data.egresos,
      transacciones: data.transacciones,
    }));
  }

  private _agruparMensualCompras(
    compras: MovimientoConFechaTotal[],
  ): ResumenPeriodo[] {
    const meses = new Map<string, { egresos: number; transacciones: number }>();
    compras.forEach((c) => {
      const mes = c.fecha.toISOString().substring(0, 7);
      const actual = meses.get(mes) || { egresos: 0, transacciones: 0 };
      actual.egresos += c.total;
      actual.transacciones += 1;
      meses.set(mes, actual);
    });
    return Array.from(meses.entries()).map(([mes, data]) => ({
      periodo: mes,
      totalIngresos: 0,
      totalEgresos: data.egresos,
      neto: -data.egresos,
      transacciones: data.transacciones,
    }));
  }
}
