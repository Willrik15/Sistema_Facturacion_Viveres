import { Controller, Get, Query, UseGuards, Post, Body } from '@nestjs/common';
import { InventarioMovimientoService } from './inventario-movimiento.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('inventario-movimiento')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventarioMovimientoController {
  constructor(
    private readonly inventarioMovimientoService: InventarioMovimientoService,
  ) {}

  @Get()
  @Roles('ADMIN', 'BODEGA')
  findAll() {
    return this.inventarioMovimientoService.findAll();
  }

  @Get('producto')
  @Roles('ADMIN', 'BODEGA')
  findByProducto(@Query('productoId') productoId: string) {
    return this.inventarioMovimientoService.findByProducto(Number(productoId));
  }

  @Post('ajuste')
  @Roles('ADMIN', 'BODEGA')
  crearAjuste(
    @Body()
    body: {
      productoId: number;
      tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
      cantidad: number;
      motivo: string;
    },
  ) {
    return this.inventarioMovimientoService.crearAjuste(body);
  }
}
