import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { FioService } from './fio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateFioDto } from './dto/create-fio.dto';
import { UpdateFioDto } from './dto/update-fio.dto';
import { QueryFioDto } from './dto/query-fio.dto';
import { PagarFioDto } from './dto/pagar-fio.dto';
import { Query } from '@nestjs/common';

@Controller('fio')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FioController {
  constructor(private readonly fioService: FioService) {}

  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  create(@Body() dto: CreateFioDto) {
    return this.fioService.create(dto);
  }

  @Post('pago')
  @Roles('ADMIN', 'VENDEDOR')
  pagar(@Body() dto: PagarFioDto) {
    return this.fioService.pagar(dto);
  }

  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findAll(@Query() query: QueryFioDto) {
    return this.fioService.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findOne(@Param('id') id: string) {
    return this.fioService.findOne(Number(id));
  }

  @Put(':id')
  @Roles('ADMIN', 'VENDEDOR')
  update(@Param('id') id: string, @Body() dto: UpdateFioDto) {
    return this.fioService.update(Number(id), dto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'VENDEDOR')
  remove(@Param('id') id: string) {
    return this.fioService.remove(Number(id));
  }
}
