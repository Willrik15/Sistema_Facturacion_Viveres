import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductoModule } from './producto/producto.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { ClienteModule } from './cliente/cliente.module';
import { CompraModule } from './compra/compra.module';
import { VentaModule } from './venta/venta.module';
import { FioModule } from './fio/fio.module';
import { ConsumoInternoModule } from './consumo-interno/consumo-interno.module';
import { SriModule } from './sri/sri.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ReportesModule } from './reportes/reportes.module';
import { UsuarioModule } from './usuario/usuario.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute window
        limit: 60, // max 60 requests per minute globally
      },
    ]),
    PrismaModule,
    AuthModule,
    ProductoModule,
    ProveedorModule,
    ClienteModule,
    CompraModule,
    VentaModule,
    FioModule,
    ConsumoInternoModule,
    SriModule,
    ChatbotModule,
    ReportesModule,
    UsuarioModule,
    MailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
