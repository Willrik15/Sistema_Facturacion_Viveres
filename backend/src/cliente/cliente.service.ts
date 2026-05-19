import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { Prisma } from '@prisma/client';

//cliente
@Injectable()
export class ClienteService {
  constructor(private prisma: PrismaService) {}
  //CRUD cliente
  async create(data: CreateClienteDto) {
    return this.prisma.cliente.create({ data });
  }
  //paginacion, busqueda y ordenamiento
  async findAll(query: QueryClienteDto) {
    const {
      page = 1,
      limit = 10,
      search,
      orderBy = 'id',
      order = 'asc',
    } = query;
    //calculo del skip para la paginacion
    const skip = (page - 1) * limit;
    const where: Prisma.ClienteWhereInput = {};
    const allowedOrderBy: Array<keyof Prisma.ClienteOrderByWithRelationInput> =
      ['id', 'nombre', 'cedula', 'tipoIdentificacion', 'telefono', 'email'];
    const orderByField = allowedOrderBy.includes(
      orderBy as keyof Prisma.ClienteOrderByWithRelationInput,
    )
      ? (orderBy as keyof Prisma.ClienteOrderByWithRelationInput)
      : 'id';
    const orderDirection: Prisma.SortOrder = order === 'desc' ? 'desc' : 'asc';
    //busqueda por nombre o cedula
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { cedula: { contains: search, mode: 'insensitive' } },
      ];
    }
    //transaccion para obtener los clientes y el total de clientes
    const [data, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [orderByField]: orderDirection,
        } as Prisma.ClienteOrderByWithRelationInput,
      }),
      this.prisma.cliente.count({ where }),
    ]);
    //retorno de los clientes y la meta de paginacion
    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
  //obtener un cliente por id
  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id },
      include: { ventas: true },
    });
    //si no se encuentra el cliente, se lanza una excepcion
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    //retorno del cliente encontrado
    return cliente;
  }
  //actualizar un cliente por id
  async update(id: number, data: UpdateClienteDto) {
    await this.findOne(id);
    //actualizacion del cliente
    return this.prisma.cliente.update({
      where: { id },
      data,
    });
  }
  //eliminar un cliente por id
  async remove(id: number) {
    await this.findOne(id);
    //eliminacion del cliente
    return this.prisma.cliente.delete({
      where: { id },
    });
  }
}
