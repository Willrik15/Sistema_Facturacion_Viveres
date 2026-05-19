import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
//controlador de cliente
@Controller('clientes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}
  //metodos del controlador de cliente
  @Post()
  @Roles('ADMIN', 'VENDEDOR')
  create(@Body() body: CreateClienteDto) {
    return this.clienteService.create(body);
  }
  //metodo para obtener todos los clientes con paginacion y filtros
  @Get()
  @Roles('ADMIN', 'VENDEDOR')
  findAll(@Query() query: QueryClienteDto) {
    return this.clienteService.findAll(query);
  }
  //metodo para obtener un cliente por id
  @Get(':id')
  @Roles('ADMIN', 'VENDEDOR')
  findOne(@Param('id') id: string) {
    return this.clienteService.findOne(Number(id));
  }
  //metodo para actualizar un cliente por id
  @Put(':id')
  @Roles('ADMIN', 'VENDEDOR')
  update(@Param('id') id: string, @Body() body: UpdateClienteDto) {
    return this.clienteService.update(Number(id), body);
  }
  //metodo para eliminar un cliente por id
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.clienteService.remove(Number(id));
  }
}
