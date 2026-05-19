import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Query } from '@nestjs/common';
import { QueryProductoDto } from './dto/query-producto.dto';
//Controlador de productos, con rutas protegidas por JWT y roles
@Controller('producto')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}
  //Rutas CRUD para productos
  @Post()
  @Roles('ADMIN')
  create(@Body() body: CreateProductoDto) {
    return this.productoService.create(body);
  }
  //Ruta para obtener productos con paginación, filtrado y ordenamiento
  @Get()
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findAll(@Query() query: QueryProductoDto) {
    return this.productoService.findAll(query);
  }
  //Ruta para buscar producto por código de barras
  @Get('scan/:codigo')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.productoService.buscarPorCodigoBarras(codigo);
  }
  //Ruta para obtener un producto por su ID
  @Get(':id')
  @Roles('ADMIN', 'VENDEDOR', 'BODEGA')
  findOne(@Param('id') id: string) {
    return this.productoService.findOne(Number(id));
  }
  //Ruta para actualizar un producto por su ID
  @Put(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() body: UpdateProductoDto) {
    return this.productoService.update(Number(id), body);
  }
  //Ruta para eliminar un producto por su ID
  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.productoService.remove(Number(id));
  }
}
