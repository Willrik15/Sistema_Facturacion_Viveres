import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Patch,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';

import { CompraService } from './compra.service';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { QueryCompraDto } from './dto/query-compra.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/interfaces/jwt-payload.interface';

//controlador de compra
@Controller('compra')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompraController {
  constructor(private readonly compraService: CompraService) {}
  //crear compra
  @Post()
  @Roles('ADMIN', 'BODEGA')
  create(@Body() dto: CreateCompraDto, @GetUser() user: JwtUser) {
    return this.compraService.create({ ...dto, usuarioId: user.id });
  }
  //obtener todas las compras
  @Get()
  @Roles('ADMIN', 'BODEGA')
  findAll(@Query() query: QueryCompraDto) {
    return this.compraService.findAll(query);
  }
  //obtener compra por id
  @Get(':id')
  @Roles('ADMIN', 'BODEGA')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.findOne(id);
  }
  //actualizar compra
  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompraDto) {
    return this.compraService.update(id, dto);
  }
  //eliminar compra
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.remove(id);
  }
  //anular compra
  @Patch(':id/anular')
  @Roles('ADMIN', 'BODEGA')
  anular(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.anular(id);
  }
}
