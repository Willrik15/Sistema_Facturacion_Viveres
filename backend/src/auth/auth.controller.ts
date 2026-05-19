import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UseGuards, Get, Req } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtUser } from './interfaces/jwt-payload.interface';

interface AuthenticatedRequest extends Request {
  user: JwtUser;
}
// Controlador de autenticación
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  // Endpoint de login — limitado a 5 intentos por minuto (anti fuerza bruta)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }
  // Endpoint protegido para obtener el perfil del usuario
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }
  // Endpoint protegido para probar roles (solo accesible por ADMIN)
  @Get('admin-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminTest() {
    return { message: 'Solo ADMIN puede ver esto' };
  }

  @SkipThrottle()
  @Post('forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @SkipThrottle()
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }
}
