import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
// El JwtAuthGuard extiende el AuthGuard de Passport con la estrategia 'jwt' para proteger las rutas que requieren autenticación JWT.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
