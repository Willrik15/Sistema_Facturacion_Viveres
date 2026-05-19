export interface LibroDiarioItem {
  fecha: string | Date;
  referencia: string;
  descripcion: string;
  tipo: 'INGRESO' | 'EGRESO';
  monto: number;
  saldo_acumulado?: number;
  refId?: number;
  detalles?: Array<{
    producto: string;
    cantidad: number;
    precio: number;
    subtotal: number;
  }>;
}

export interface ResumenPeriodo {
  periodo: string;
  totalIngresos: number;
  totalEgresos: number;
  neto: number;
  transacciones: number;
}

export interface ProductoMasVendido {
  id: number;
  nombre: string;
  cantidadVendida: number;
  ingresoTotal: number;
  porcentaje: number;
}

export interface ClienteMasFrecuente {
  id: number;
  nombre: string;
  transacciones: number;
  totalComprado: number;
  porcentaje: number;
}

export interface FlujoCaja {
  periodo?: string;
  ingresos: number;
  egresos: number;
  neto: number;
  margen: number;
  margenNeto?: number | string;
  ventasCount?: number;
  comprasCount?: number;
}

export interface GananciaProducto {
  productoId: number;
  producto: string;
  categoria?: string | null;
  unidadesVendidas: number;
  ingresos: number;
  costos: number;
  ganancia: number;
  margenPorcentaje: number;
}

export interface GananciaDiaria {
  fecha: string;
  ingresosVentas: number;
  ingresosPagosFio: number;
  egresosCompras: number;
  egresosFios: number;
  egresosConsumoInterno: number;
  neto: number;
}
