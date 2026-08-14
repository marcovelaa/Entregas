import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IRolRepository } from '../../domain/repositories/rol.repository.interface';
import { Rol } from '../../domain/entities/rol.entity';

@Injectable()
export class PrismaRolRepository implements IRolRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Mapeador: Convierte el modelo crudo de Prisma a nuestra Entidad Pura de Dominio
  private mapToDomain(model: any): Rol {
    return new Rol(
      model.id,
      model.nombre,
      model.descripcion,
      model.activo,
      model.creado_en,
      model.actualizado_en,
    );
  }

  async findByNombre(nombre: string): Promise<Rol | null> {
    const rolModel = await this.prisma.rol.findUnique({
      where: { nombre },
    });

    if (!rolModel) return null;

    return this.mapToDomain(rolModel);
  }

  async findAll(): Promise<Rol[]> {
    const rolesModel = await this.prisma.rol.findMany({
      orderBy: { id: 'asc' },
    });

    return rolesModel.map(
      (model: Prisma.RolGetPayload<Record<string, never>>) =>
        this.mapToDomain(model),
    );
  }

  async save(rol: Rol): Promise<Rol> {
    const rolGuardado = await this.prisma.rol.create({
      data: {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: rol.activo,
        // No pasamos ID ni fechas, Prisma/Postgres se encargan de generarlos automáticamente.
      },
    });

    return this.mapToDomain(rolGuardado);
  }

  async findById(id: bigint): Promise<Rol | null> {
    const rolModel = await this.prisma.rol.findUnique({
      where: { id },
    });
    if (!rolModel) return null;
    return this.mapToDomain(rolModel);
  }

  async update(rol: Rol): Promise<Rol> {
    const rolActualizado = await this.prisma.rol.update({
      where: { id: rol.id },
      data: {
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        activo: rol.activo,
      },
    });
    return this.mapToDomain(rolActualizado);
  }

  async delete(id: bigint): Promise<void> {
    await this.prisma.rol.update({
      where: { id },
      data: { activo: false },
    });
  }

  async getPermisosPorRol(id: bigint): Promise<string[]> {
    const relaciones = await this.prisma.rolPermiso.findMany({
      where: { rol_id: id },
    });
    return relaciones.map(
      (r: Prisma.RolPermisoGetPayload<Record<string, never>>) =>
        r.permiso_codigo,
    );
  }

  async asignarPermisos(id: bigint, permisos: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Eliminar actuales
      await tx.rolPermiso.deleteMany({ where: { rol_id: id } });
      // Insertar nuevos
      if (permisos.length > 0) {
        await tx.rolPermiso.createMany({
          data: permisos.map((p) => ({ rol_id: id, permiso_codigo: p })),
        });
      }
    });
  }
}
