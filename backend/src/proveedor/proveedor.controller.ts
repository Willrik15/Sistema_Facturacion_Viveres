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
import { ProveedorService } from './proveedor.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { QueryProveedorDto } from './dto/query-proveedor.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
// Controlador para manejar las rutas relacionadas con los proveedores
@Controller('proveedores')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}
  // Ruta para crear un nuevo proveedor
  @Post()
  @Roles('ADMIN')
  create(@Body() body: CreateProveedorDto) {
    return this.proveedorService.create(body);
  }
  // Ruta para obtener la lista de proveedores con opciones de paginación, búsqueda y ordenamiento
  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findAll(@Query() query: QueryProveedorDto) {
    return this.proveedorService.findAll(query);
  }
  // Ruta para obtener un proveedor específico por su ID
  @Get(':id')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findOne(@Param('id') id: string) {
    return this.proveedorService.findOne(Number(id));
  }
  // Ruta para actualizar un proveedor existente por su ID
  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateProveedorDto) {
    return this.proveedorService.update(Number(id), body);
  }
  // Ruta para eliminar un proveedor por su ID
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.proveedorService.remove(Number(id));
  }
}
