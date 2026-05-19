import { Module } from '@nestjs/common';
import { InventarioMovimientoService } from './inventario-movimiento.service';
import { InventarioMovimientoController } from './inventario-movimiento.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InventarioMovimientoController],
  providers: [InventarioMovimientoService],

  exports: [InventarioMovimientoService],
})
export class InventarioMovimientoModule {}
