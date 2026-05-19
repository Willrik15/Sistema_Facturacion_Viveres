import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { ConsumoInternoService } from './consumo-interno.service';
import { CreateConsumoDto } from './dto/create-consumo.dto';
import { UpdateConsumoDto } from './dto/update-consumo.dto';
import { QueryConsumoDto } from './dto/query-consumo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/interfaces/jwt-payload.interface';

@Controller('consumo-interno')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsumoInternoController {
  constructor(private readonly service: ConsumoInternoService) {}

  @Post()
  @Roles('ADMIN', 'BODEGA', 'VENDEDOR')
  create(@Body() dto: CreateConsumoDto, @GetUser() user: JwtUser) {
    return this.service.create({ ...dto, usuarioId: user.id });
  }

  @Get()
  @Roles('ADMIN', 'BODEGA', 'VENDEDOR')
  findAll(@Query() query: QueryConsumoDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'BODEGA', 'VENDEDOR')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  @Roles('ADMIN', 'BODEGA')
  update(@Param('id') id: string, @Body() dto: UpdateConsumoDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'BODEGA')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
