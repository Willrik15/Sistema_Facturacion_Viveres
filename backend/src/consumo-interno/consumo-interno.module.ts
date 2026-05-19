import { Module } from '@nestjs/common';
import { ConsumoInternoService } from './consumo-interno.service';
import { ConsumoInternoController } from './consumo-interno.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventarioMovimientoModule } from '../inventario-movimiento/inventario-movimiento.module';

@Module({
  imports: [PrismaModule, InventarioMovimientoModule],
  controllers: [ConsumoInternoController],
  providers: [ConsumoInternoService],
})
export class ConsumoInternoModule {}
