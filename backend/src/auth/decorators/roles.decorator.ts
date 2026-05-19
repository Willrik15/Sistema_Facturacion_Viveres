import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar qué roles pueden acceder a un endpoint
 * Uso: @Roles('ADMIN', 'VENDEDOR')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
