import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator';
import { Request } from 'express';
import { JwtUser } from './interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user?: JwtUser;
}

/**
 * Guard para validar los roles de los usuarios
 * Se usa con el decorador @Roles('ADMIN', 'VENDEDOR')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se requieren roles específicos, se permite el acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener el usuario desde la request
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { user } = request;

    if (!user) {
      throw new ForbiddenException('Usuario no encontrado en la sesión');
    }

    if (!user.rol) {
      throw new ForbiddenException('El usuario no tiene un rol asignado');
    }

    // SUPERADMIN puede acceder a cualquier recurso protegido por roles.
    if (user.rol === 'SUPERADMIN') {
      return true;
    }

    // Verificar si el rol del usuario está en los roles permitidos
    const hasRole = requiredRoles.includes(user.rol);

    if (!hasRole) {
      throw new ForbiddenException(
        `Tu rol (${user.rol}) no tiene permiso para acceder a este recurso. Roles permitidos: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
