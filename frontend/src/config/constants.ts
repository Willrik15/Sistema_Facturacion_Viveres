// Configuración de la aplicación
export const AppConfig = {
  appName: 'Viveres Lupita',
  appVersion: '1.0.0',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  environment: import.meta.env.MODE,
}

// Mensajes de validación
export const ValidationMessages = {
  REQUIRED: 'Este campo es requerido',
  INVALID_EMAIL: 'Email inválido',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
  INVALID_PHONE: 'Teléfono inválido',
  INVALID_RUC: 'RUC inválido',
  INVALID_CEDULA: 'Cédula inválida',
}

// Estados de pago
export const PaymentStatus = {
  PENDING: 'pendiente',
  PAID: 'pagada',
  PARTIAL: 'parcial',
  OVERDUE: 'vencida',
} as const

// Estados de venta
export const SaleStatus = {
  PENDING: 'pendiente',
  PAID: 'pagada',
  CANCELLED: 'anulada',
} as const

// Estados de compra
export const PurchaseStatus = {
  PENDING: 'pendiente',
  RECEIVED: 'recibida',
  CANCELLED: 'anulada',
} as const

// Roles de usuario
export const UserRoles = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  BODEGA: 'BODEGA',
} as const

// Permisos
export const Permissions = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_SALES: 'manage_sales',
  MANAGE_PURCHASES: 'manage_purchases',
  MANAGE_CLIENTS: 'manage_clients',
  MANAGE_USERS: 'manage_users',
  VIEW_REPORTS: 'view_reports',
} as const
