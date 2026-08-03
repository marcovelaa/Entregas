import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IProveedorRepository,
  ProveedorEntity,
} from '../../domain/repositories/proveedor.repository.interface';

@Injectable()
export class PrismaProveedorRepository implements IProveedorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(proveedor: Partial<ProveedorEntity>): Promise<ProveedorEntity> {
    return this.prisma.proveedor.create({
      data: {
        nombre: proveedor.nombre!,
        contacto: proveedor.contacto,
        telefono: proveedor.telefono,
        direccion: proveedor.direccion,
        email: proveedor.email,
        activo: proveedor.activo ?? true,
      },
    }) as unknown as ProveedorEntity;
  }

  async listar(params: { offset: number; limit: number }): Promise<{ total: number; data: ProveedorEntity[] }> {
    const [total, data] = await Promise.all([
      this.prisma.proveedor.count(),
      this.prisma.proveedor.findMany({
        skip: params.offset,
        take: params.limit,
        orderBy: { nombre: 'asc' },
      }),
    ]);
    return { total, data: data as unknown as ProveedorEntity[] };
  }

  async buscarPorId(id: bigint): Promise<ProveedorEntity | null> {
    return this.prisma.proveedor.findUnique({
      where: { id },
    }) as unknown as ProveedorEntity | null;
  }

  async actualizar(id: bigint, datos: Partial<ProveedorEntity>): Promise<ProveedorEntity> {
    return this.prisma.proveedor.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined && { nombre: datos.nombre }),
        ...(datos.contacto !== undefined && { contacto: datos.contacto }),
        ...(datos.telefono !== undefined && { telefono: datos.telefono }),
        ...(datos.direccion !== undefined && { direccion: datos.direccion }),
        ...(datos.email !== undefined && { email: datos.email }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      },
    }) as unknown as ProveedorEntity;
  }
}
