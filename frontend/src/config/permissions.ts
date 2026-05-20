/**
 * Sistema centralizado de permisos por rol.
 * Define qué rutas y módulos puede ver/acceder cada rol.
 */

export type Role = 'SUPERADMIN' | 'ADMIN' | 'VENDEDOR' | 'BODEGA'

export interface RoutePermission {
  path: string
  roles: Role[]
}

// Permisos de rutas — qué roles pueden ACCEDER a cada ruta
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  { path: '/dashboard',       roles: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
  { path: '/ventas',          roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/inventario',      roles: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
  { path: '/compras',         roles: ['ADMIN', 'BODEGA'] },
  { path: '/fios',            roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/consumo-interno', roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/kardex',          roles: ['ADMIN', 'BODEGA'] },
  { path: '/facturas',        roles: ['ADMIN', 'VENDEDOR'] },
  { path: '/contabilidad',    roles: ['ADMIN'] },
  { path: '/chatbot',         roles: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
  { path: '/usuarios',        roles: ['ADMIN'] },
  { path: '/settings',        roles: ['ADMIN', 'VENDEDOR', 'BODEGA'] },
]

/**
 * Verifica si un rol tiene permiso para acceder a una ruta.
 */
export function canAccess(role: Role | undefined, path: string): boolean {
  if (!role) return false
  if (role === 'SUPERADMIN') return true
  const permission = ROUTE_PERMISSIONS.find((p) => p.path === path)
  if (!permission) return false
  return permission.roles.includes(role)
}

/**
 * Retorna las rutas accesibles para un rol dado.
 */
export function getAccessibleRoutes(role: Role | undefined): string[] {
  if (!role) return []
  if (role === 'SUPERADMIN') {
    return ROUTE_PERMISSIONS.map((p) => p.path)
  }
  return ROUTE_PERMISSIONS
    .filter((p) => p.roles.includes(role))
    .map((p) => p.path)
}
