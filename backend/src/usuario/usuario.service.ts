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
  rol: RolUsuario | string;
};

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeRole(role: RolUsuario | string): RolUsuario {
    const normalized = String(role || '').trim().toUpperCase();

    if (normalized === 'SUPERADMIN' || normalized === 'SUPER_ADMIN') {
      return RolUsuario.SUPERADMIN;
    }
    if (normalized === 'ADMIN') return RolUsuario.ADMIN;
    if (normalized === 'VENDEDOR') return RolUsuario.VENDEDOR;
    if (normalized === 'BODEGA') return RolUsuario.BODEGA;

    throw new ForbiddenException('Rol de usuario inválido en la sesión');
  }

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

    const actorRole = this.normalizeRole(actor.rol);
    const normalizedTargetRole = this.normalizeRole(targetRole);

    if (actorRole === RolUsuario.SUPERADMIN) {
      return;
    }

    if (actorRole !== RolUsuario.ADMIN) {
      throw new ForbiddenException(
        'No tienes permisos para gestionar usuarios',
      );
    }

    if (
      normalizedTargetRole === RolUsuario.ADMIN ||
      normalizedTargetRole === RolUsuario.SUPERADMIN
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
        activo: true,
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
        activo: true,
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
        activo: true,
        rol: roleToAssign,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        activo: true,
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
        activo: true,
        rol: true,
      },
    });
    return usuario;
  }

  async remove(id: number, actor: SessionUser) {
    const target = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, rol: true, activo: true },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    this.assertRoleManagement(actor, target.rol, 'eliminar', target.id);

    if (!target.activo) {
      return { message: 'El usuario ya estaba desactivado' };
    }

    await this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
    });

    return { message: 'Usuario desactivado correctamente' };
  }
}
