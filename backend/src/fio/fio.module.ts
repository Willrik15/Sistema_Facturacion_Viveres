import { Module } from '@nestjs/common';
import { FioService } from './fio.service';
import { FioController } from './fio.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { InventarioMovimientoModule } from '../inventario-movimiento/inventario-movimiento.module';
import { SriModule } from '../sri/sri.module';

@Module({
  imports: [PrismaModule, InventarioMovimientoModule, SriModule],
  controllers: [FioController],
  providers: [FioService],
})
export class FioModule {}
