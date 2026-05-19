import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, RolUsuario } from '@prisma/client';

type SessionUser = {
  id: number;
  rol: RolUsuario;
};

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  private assertRoleManagement(
    actor: SessionUser,
    targetRole: RolUsuario,
    action: 'crear' | 'editar' | 'eliminar',
    targetId?: number,
  ) {
    if (actor.id === targetId) {
      throw new ForbiddenException(
        'No puedes eliminar o modificar tu propio usuario',
      );
    }

    if (actor.rol === RolUsuario.SUPERADMIN) {
      return;
    }

    if (actor.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException(
        'No tienes permisos para gestionar usuarios',
      );
    }

    if (
      targetRole === RolUsuario.ADMIN ||
      targetRole === RolUsuario.SUPERADMIN
    ) {
      throw new ForbiddenException(
        `Un ADMIN no puede ${action} usuarios con rol ADMIN o SUPERADMIN`,
      );
    }
  }

  async findAll() {
    const usuarios = await this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
      orderBy: { id: 'asc' },
    });
    return usuarios;
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async create(dto: CreateUsuarioDto, actor: SessionUser) {
    const existe = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existe) throw new ConflictException('El email ya está registrado');

    const roleToAssign = dto.rol ?? RolUsuario.VENDEDOR;
    this.assertRoleManagement(actor, roleToAssign, 'crear');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        password: hashedPassword,
        rol: roleToAssign,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
    });
    return usuario;
  }

  async update(id: number, dto: UpdateUsuarioDto, actor: SessionUser) {
    const target = await this.prisma.usuario.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    this.assertRoleManagement(actor, target.rol, 'editar', target.id);

    const updatedRole = dto.rol ?? target.rol;
    this.assertRoleManagement(actor, updatedRole, 'editar', target.id);

    if (dto.email) {
      const existe = await this.prisma.usuario.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existe) throw new ConflictException('El email ya está en uso');
    }

    const data: Prisma.UsuarioUpdateInput = {
      ...dto,
    };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
    });
    return usuario;
  }

  async remove(id: number, actor: SessionUser) {
    const target = await this.prisma.usuario.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    this.assertRoleManagement(actor, target.rol, 'eliminar', target.id);

    await this.prisma.usuario.delete({ where: { id } });
    return { message: 'Usuario eliminado correctamente' };
  }
}
