import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { QueryProductoDto } from './dto/query-producto.dto';
import { Prisma } from '@prisma/client';
// Servicio para manejar la lógica de negocio relacionada con productos
@Injectable()
export class ProductoService {
  constructor(private prisma: PrismaService) {}

  // Crear
  async create(dto: CreateProductoDto) {
    const proveedorGeneral = await this.prisma.proveedor.upsert({
      where: { ruc: '0000000000000' },
      update: {},
      create: {
        nombre: 'PROVEEDOR GENERAL',
        ruc: '0000000000000',
        telefono: '0000000000',
      },
    });

    return this.prisma.producto.create({
      data: {
        nombre: dto.nombre,
        categoria: dto.categoria,
        margenGanancia: dto.margenGanancia ?? 25,
        precio: dto.precio,
        // Regla de negocio: todo producto nuevo inicia en 0 y se incrementa por compras/kardex.
        stock: 0,
        stockMinimo: dto.stockMinimo,
        codigoBarras: dto.codigoBarras,
        proveedorId: dto.proveedorId || proveedorGeneral.id,
      },
    });
  }

  // Listar con paginación + búsqueda + orden
  async findAll(query: QueryProductoDto) {
    const {
      page = 1,
      limit = 10,
      search,
      orderBy = 'id',
      order = 'asc',
      minPrice,
      maxPrice,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductoWhereInput = {};
    const allowedOrderBy: Array<keyof Prisma.ProductoOrderByWithRelationInput> =
      [
        'id',
        'nombre',
        'categoria',
        'margenGanancia',
        'precio',
        'stock',
        'stockMinimo',
        'codigoBarras',
        'proveedorId',
      ];
    const orderByField = allowedOrderBy.includes(
      orderBy as keyof Prisma.ProductoOrderByWithRelationInput,
    )
      ? (orderBy as keyof Prisma.ProductoOrderByWithRelationInput)
      : 'id';
    const orderDirection: Prisma.SortOrder = order === 'desc' ? 'desc' : 'asc';

    // Búsqueda flexible: nombre, código de barras, proveedor
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { codigoBarras: { contains: search, mode: 'insensitive' } },
        { proveedor: { nombre: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Filtro por precio si se proporciona rango
    if (minPrice || maxPrice) {
      const filtroPrecio: Prisma.FloatFilter = {};
      if (minPrice !== undefined) filtroPrecio.gte = Number(minPrice);
      if (maxPrice !== undefined) filtroPrecio.lte = Number(maxPrice);
      where.precio = filtroPrecio;
    }

    // Ejecutamos ambas consultas en una transacción
    const [data, total] = await this.prisma.$transaction([
      this.prisma.producto.findMany({
        where,
        include: { proveedor: true },
        skip,
        take: limit,
        orderBy: {
          [orderByField]: orderDirection,
        } as Prisma.ProductoOrderByWithRelationInput,
      }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // Buscar por ID
  async findOne(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: { proveedor: true },
    });
    // Si no se encuentra el producto, lanzamos una excepción
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    return producto;
  }

  // Actualizar
  async update(id: number, data: UpdateProductoDto) {
    await this.findOne(id);

    return this.prisma.producto.update({
      where: { id },
      data,
      include: { proveedor: true },
    });
  }

  // Eliminar
  async remove(id: number) {
    await this.findOne(id);

    // Verificar si el producto tiene movimientos/ventas/compras asociadas
    const [ventas, compras, consumos, movimientos] = await Promise.all([
      this.prisma.detalleVenta.count({ where: { productoId: id } }),
      this.prisma.detalleCompra.count({ where: { productoId: id } }),
      this.prisma.detalleConsumo.count({ where: { productoId: id } }),
      this.prisma.inventarioMovimiento.count({ where: { productoId: id } }),
    ]);

    if (ventas > 0 || compras > 0 || consumos > 0 || movimientos > 0) {
      throw new BadRequestException(
        `No se puede eliminar el producto porque tiene registros asociados (${ventas} ventas, ${compras} compras, ${consumos} consumos)`,
      );
    }

    return this.prisma.producto.delete({
      where: { id },
    });
  }

  async buscarPorCodigoBarras(codigo: string) {
    const producto = await this.prisma.producto.findUnique({
      where: {
        codigoBarras: codigo,
      },
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return producto;
  }
}
