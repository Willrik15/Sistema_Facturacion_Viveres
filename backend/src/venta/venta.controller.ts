import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Delete,
} from '@nestjs/common';

import { VentaService } from './venta.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/interfaces/jwt-payload.interface';
import type { Request } from 'express';
import { Req } from '@nestjs/common';

//operaciones de venta
@Controller('ventas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VentaController {
  // Inyectamos el servicio de venta para manejar la lógica de negocio relacionada con las ventas.
  constructor(private readonly ventaService: VentaService) {}
  // Crear una nueva venta
  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  create(@Body() dto: CreateVentaDto, @GetUser() user: JwtUser) {
    return this.ventaService.create(dto, user);
  }
  // Listar ventas con paginación y filtros opcionales
  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findAll(@GetUser() user: JwtUser) {
    return this.ventaService.findAll(user);
  }
  // Generar reporte financiero de ventas en un rango de fechas
  @Get('reporte')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  reporte(
    @Query('fechaDesde') fechaDesde: string,
    @Query('fechaHasta') fechaHasta: string,
  ) {
    return this.ventaService.reporteFinanciero(fechaDesde, fechaHasta);
  }
  // Obtener detalles de una venta por ID
  @Get(':id')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.ventaService.findOne(Number(id), req.user as JwtUser);
  }
  // Anular una venta por ID
  @Delete(':id')
  @Roles('ADMIN', 'VENDEDOR')
  remove(@Param('id') id: string) {
    return this.ventaService.anular(Number(id));
  }
}
