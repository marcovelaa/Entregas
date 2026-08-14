import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  ICategoriaRepository,
  CategoriaEntity,
  CategoriaConSubcategorias,
} from '../../domain/repositories/categoria.repository.interface';

@Injectable()
export class PrismaCategoriaRepository implements ICategoriaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(categoria: Partial<CategoriaEntity>): Promise<CategoriaEntity> {
    return this.prisma.categoria.create({
      data: {
        nombre: categoria.nombre!,
        slug: categoria.slug!,
        descripcion: categoria.descripcion,
        activo: categoria.activo ?? true,
        ...(categoria.categoria_padre_id && {
          categoria_padre_id: categoria.categoria_padre_id,
        }),
        ...(categoria.plantilla_atributos !== undefined && {
          plantilla_atributos: categoria.plantilla_atributos,
        }),
      },
    });
  }

  async actualizar(
    id: bigint,
    datos: Partial<CategoriaEntity>,
  ): Promise<CategoriaEntity> {
    return this.prisma.categoria.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined && { nombre: datos.nombre }),
        ...(datos.slug !== undefined && { slug: datos.slug }),
        ...(datos.descripcion !== undefined && {
          descripcion: datos.descripcion,
        }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
        ...(datos.categoria_padre_id !== undefined && {
          categoria_padre_id: datos.categoria_padre_id,
        }),
        ...(datos.plantilla_atributos !== undefined && {
          plantilla_atributos: datos.plantilla_atributos,
        }),
      },
    });
  }

  async buscarPorSlug(slug: string): Promise<CategoriaEntity | null> {
    return this.prisma.categoria.findUnique({
      where: { slug },
    });
  }

  async buscarPorId(id: bigint): Promise<CategoriaEntity | null> {
    return this.prisma.categoria.findUnique({
      where: { id },
    });
  }

  async buscarTodas(
    filtros?: { activo?: boolean; padre_id?: bigint | null },
    page = 1,
    limit = 20,
  ): Promise<{ data: CategoriaEntity[]; total: number }> {
    const where = {
      ...(filtros?.activo !== undefined && { activo: filtros.activo }),
      ...(filtros?.padre_id !== undefined && {
        categoria_padre_id: filtros.padre_id,
      }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.categoria.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.categoria.count({ where }),
    ]);
    return { data: data as unknown as CategoriaEntity[], total };
  }

  async buscarConSubcategorias(
    id: bigint,
  ): Promise<CategoriaConSubcategorias | null> {
    const result = await this.prisma.categoria.findUnique({
      where: { id },
      include: { subcategorias: true },
    });
    return result;
  }
}
