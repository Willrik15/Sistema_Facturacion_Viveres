import { Module } from '@nestjs/common';
import { CompraService } from './compra.service';
import { CompraController } from './compra.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventarioMovimientoModule } from '../inventario-movimiento/inventario-movimiento.module';

@Module({
  imports: [PrismaModule, InventarioMovimientoModule],
  controllers: [CompraController],
  providers: [CompraService],
})
export class CompraModule {}
