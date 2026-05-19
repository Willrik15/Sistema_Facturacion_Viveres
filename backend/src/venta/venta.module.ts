import { Module } from '@nestjs/common';
import { VentaService } from './venta.service';
import { VentaController } from './venta.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventarioMovimientoModule } from '../inventario-movimiento/inventario-movimiento.module';
import { SriModule } from '../sri/sri.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, InventarioMovimientoModule, SriModule, MailModule],
  controllers: [VentaController],
  providers: [VentaService],
})
export class VentaModule {}
