export interface JwtUser {
  id: number;
  email: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'VENDEDOR' | 'BODEGA';
}
