import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';
import { createHash, randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async login(data: LoginDto) {
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        password: true,
        rol: true,
      },
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');
    const passwordValid = await bcrypt.compare(data.password, user.password);
    if (!passwordValid)
      throw new UnauthorizedException('Credenciales inválidas');
    const payload = { sub: user.id, email: user.email, rol: user.rol };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        rol: user.rol,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
      },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return user;
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, nombre: true },
    });
    if (!user) {
      return {
        message:
          'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
      };
    }
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: expiresAt,
      },
    });
    try {
      await this.mailService.enviarRecuperacionPassword(
        user.email,
        user.nombre,
        rawToken,
      );
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `\n[RECUPERACION PASSWORD]\nEmail: ${user.email}\nToken: ${rawToken}\nURL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?resetToken=${rawToken}\n`,
        );
      }
    }
    return {
      message:
        'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const user = await this.prisma.usuario.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!user) throw new BadRequestException('Token inválido o expirado');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
