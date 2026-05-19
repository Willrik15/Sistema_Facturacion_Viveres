import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { QueryProveedorDto } from './dto/query-proveedor.dto';
import { Prisma } from '@prisma/client';
// Servicio para manejar la lógica de negocio relacionada con los proveedores
@Injectable()
export class ProveedorService {
  constructor(private prisma: PrismaService) {}
  // Método para crear un nuevo proveedor
  async create(data: CreateProveedorDto) {
    return this.prisma.proveedor.create({ data });
  }
  // Método para obtener una lista de proveedores con paginación, búsqueda y ordenamiento
  async findAll(query: QueryProveedorDto) {
    const {
      page = 1,
      limit = 10,
      search,
      orderBy = 'id',
      order = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProveedorWhereInput = {};
    const allowedOrderBy: Array<
      keyof Prisma.ProveedorOrderByWithRelationInput
    > = ['id', 'nombre', 'ruc', 'telefono'];
    const orderByField = allowedOrderBy.includes(
      orderBy as keyof Prisma.ProveedorOrderByWithRelationInput,
    )
      ? (orderBy as keyof Prisma.ProveedorOrderByWithRelationInput)
      : 'id';
    const orderDirection: Prisma.SortOrder = order === 'desc' ? 'desc' : 'asc';
    // Si se proporciona un término de búsqueda, se filtran los proveedores por nombre o RUC que contengan el término
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { ruc: { contains: search, mode: 'insensitive' } },
      ];
    }
    // Se ejecuta una transacción para obtener los proveedores y el conteo total de proveedores que cumplen con los criterios de búsqueda
    const [data, total] = await this.prisma.$transaction([
      this.prisma.proveedor.findMany({
        where,
        include: { productos: true },
        skip,
        take: limit,
        orderBy: {
          [orderByField]: orderDirection,
        } as Prisma.ProveedorOrderByWithRelationInput,
      }),
      this.prisma.proveedor.count({ where }),
    ]);
    // Se devuelve la lista de proveedores junto con la información de paginación en el formato esperado por el frontend
    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
  // Método para obtener un proveedor por su ID, incluyendo sus productos relacionados
  async findOne(id: number) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: { productos: true },
    });
    // Si no se encuentra el proveedor, se lanza una excepción
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return proveedor;
  }
  // Método para actualizar un proveedor existente, primero se verifica que el proveedor exista y luego se actualiza con los nuevos datos
  async update(id: number, data: UpdateProveedorDto) {
    await this.findOne(id);

    return this.prisma.proveedor.update({
      where: { id },
      data,
    });
  }
  // Método para eliminar un proveedor, primero se verifica que el proveedor exista y luego se elimina de la base de datos
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.proveedor.delete({
      where: { id },
    });
  }
}
