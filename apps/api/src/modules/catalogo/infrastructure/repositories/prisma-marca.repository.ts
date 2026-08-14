import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IMarcaRepository,
  MarcaEntity,
} from '../../domain/repositories/marca.repository.interface';

@Injectable()
export class PrismaMarcaRepository implements IMarcaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(marca: Partial<MarcaEntity>): Promise<MarcaEntity> {
    return this.prisma.marca.create({
      data: {
        nombre: marca.nombre!,
        slug: marca.slug!,
        descripcion: marca.descripcion,
        activo: marca.activo ?? true,
      },
    });
  }

  async buscarTodas(
    filtros?: { activo?: boolean },
    page = 1,
    limit = 20,
  ): Promise<{ data: MarcaEntity[]; total: number }> {
    const where = {
      ...(filtros?.activo !== undefined && { activo: filtros.activo }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.marca.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.marca.count({ where }),
    ]);
    return { data: data as unknown as MarcaEntity[], total };
  }

  async buscarPorId(id: bigint): Promise<MarcaEntity | null> {
    return this.prisma.marca.findUnique({
      where: { id },
    });
  }

  async buscarPorSlug(slug: string): Promise<MarcaEntity | null> {
    return this.prisma.marca.findUnique({
      where: { slug },
    });
  }

  async actualizar(
    id: bigint,
    datos: Partial<MarcaEntity>,
  ): Promise<MarcaEntity> {
    return this.prisma.marca.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined && { nombre: datos.nombre }),
        ...(datos.slug !== undefined && { slug: datos.slug }),
        ...(datos.descripcion !== undefined && {
          descripcion: datos.descripcion,
        }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      },
    });
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.marca.delete({
      where: { id },
    });
  }

  async contarProductosAsociados(id: bigint): Promise<number> {
    return this.prisma.producto.count({
      where: { marca_id: id },
    });
  }
}
