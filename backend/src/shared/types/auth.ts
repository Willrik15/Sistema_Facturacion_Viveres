export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  BODEGA: 'BODEGA',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  apellido?: string;
  rol: Role;
}
