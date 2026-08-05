import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IUsuarioRepository } from '../../domain/repositories/usuario.repository.interface';
import { Usuario } from '../../domain/entities/usuario.entity';

@Injectable()
export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(model: any): Usuario {
    return new Usuario(
      model.id,
      model.public_id,
      model.rol_id,
      model.nombres,
      model.apellidos,
      model.email,
      model.telefono,
      model.password_hash,
      model.codigo_referido,
      model.activo,
      model.ultimo_acceso_en,
      model.creado_en,
      model.actualizado_en,
    );
  }

  async findById(id: bigint): Promise<Usuario | null> {
    const user = await this.prisma.usuario.findUnique({ where: { id } });
    return user ? this.mapToDomain(user) : null;
  }

  async findByPublicId(publicId: string): Promise<Usuario | null> {
    const user = await this.prisma.usuario.findUnique({ where: { public_id: publicId } });
    return user ? this.mapToDomain(user) : null;
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const user = await this.prisma.usuario.findUnique({ where: { email } });
    return user ? this.mapToDomain(user) : null;
  }

  async findAll(): Promise<Usuario[]> {
    const users = await this.prisma.usuario.findMany({ orderBy: { id: 'desc' } });
    return users.map((u: Prisma.UsuarioGetPayload<Record<string, never>>) => this.mapToDomain(u));
  }

  async save(usuario: Usuario): Promise<Usuario> {
    const nuevoUser = await this.prisma.usuario.create({
      data: {
        rol_id: usuario.rolId,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        telefono: usuario.telefono,
        password_hash: usuario.passwordHash,
        codigo_referido: usuario.codigoReferido,
        activo: usuario.activo,
      },
    });
    return this.mapToDomain(nuevoUser);
  }

  async update(usuario: Usuario): Promise<Usuario> {
    const userModificado = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        rol_id: usuario.rolId,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        telefono: usuario.telefono,
        activo: usuario.activo,
        ultimo_acceso_en: usuario.ultimoAccesoEn,
      },
    });
    return this.mapToDomain(userModificado);
  }

  async delete(id: bigint): Promise<void> {
    // Implementación de Soft Delete: Solo desactivamos al usuario
    await this.prisma.usuario.update({ 
      where: { id },
      data: { activo: false }
    });
  }
}
