import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { MailModule } from '../mail/mail.module';
import type { StringValue } from 'ms';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const expiresInRaw = config.get<string>('JWT_EXPIRES_IN') || '1d';
        const expiresIn: StringValue | number = /^\d+$/.test(expiresInRaw)
          ? Number(expiresInRaw)
          : (expiresInRaw as StringValue);
        if (!secret)
          throw new Error(
            'JWT_SECRET no está configurado en las variables de entorno',
          );
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
})
export class AuthModule {}
