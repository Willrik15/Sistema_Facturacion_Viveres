// Usuario
export interface Usuario {
  id: number
  email: string
  nombre: string
  rol: 'SUPERADMIN' | 'ADMIN' | 'VENDEDOR' | 'BODEGA'
  createdAt: Date
  updatedAt: Date
}

// Producto
export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  stockMinimo: number
  codigoBarras?: string
  createdAt: Date
  updatedAt: Date
}

// Cliente
export interface Cliente {
  id: number
  nombre: string
  email?: string
  telefono?: string
  ruc?: string
  cedula?: string
  direccion?: string
  createdAt: Date
  updatedAt: Date
}

// Venta/Factura
export interface Venta {
  id: number
  numeroFactura: string
  clienteId: number
  fecha: Date
  subtotal: number
  iva: number
  total: number
  estado: 'pendiente' | 'pagada' | 'anulada'
  detalles: DetalleVenta[]
  createdAt: Date
  updatedAt: Date
}

export interface DetalleVenta {
  id: number
  ventaId: number
  productoId: number
  cantidad: number
  precio: number
  subtotal: number
}

// Fio (Crédito)
export interface Fio {
  id: number
  clienteId: number
  ventaId?: number
  monto: number
  montoPagado: number
  estado: 'pendiente' | 'pagada' | 'parcial'
  fechaVencimiento?: Date
  createdAt: Date
  updatedAt: Date
}

// Compra
export interface Compra {
  id: number
  numeroCompra: string
  proveedorId: number
  fecha: Date
  total: number
  estado: 'pendiente' | 'recibida' | 'anulada'
  detalles: DetalleCompra[]
  createdAt: Date
  updatedAt: Date
}

export interface DetalleCompra {
  id: number
  compraId: number
  productoId: number
  cantidad: number
  precioUnitario: number
  subtotal: number
}

// Proveedor
export interface Proveedor {
  id: number
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  ruc?: string
  direccion?: string
  createdAt: Date
  updatedAt: Date
}

// Consumo Interno
export interface ConsumoInterno {
  id: number
  productoId: number
  cantidad: number
  motivo: string
  fecha: Date
  createdAt: Date
  updatedAt: Date
}

// Rol
export type RoleName = 'SUPERADMIN' | 'ADMIN' | 'VENDEDOR' | 'BODEGA'

// API Response
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Auth
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: Usuario
}

// Error Response
export interface ErrorResponse {
  message: string
  statusCode: number
  error: string
}
