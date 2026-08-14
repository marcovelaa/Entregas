import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IEmpaqueRepository } from '../../domain/repositories/empaque.repository.interface';
import { EmpaqueEntity } from '../../domain/entities/empaque.entity';

@Injectable()
export class PrismaEmpaqueRepository implements IEmpaqueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(empaque: Partial<EmpaqueEntity>): Promise<EmpaqueEntity> {
    return this.prisma.empaque.create({
      data: {
        variante_id: empaque.variante_id!,
        nombre: empaque.nombre!,
        sku: empaque.sku!,
        codigo_barras: empaque.codigo_barras,
        multiplicador_unidades: empaque.multiplicador_unidades ?? 1,
        precio: empaque.precio!,
        precio_promocional: empaque.precio_promocional,
        activo: empaque.activo ?? true,
      },
    }) as unknown as EmpaqueEntity;
  }

  async actualizar(
    id: bigint,
    empaque: Partial<EmpaqueEntity>,
  ): Promise<EmpaqueEntity> {
    const dataToUpdate: any = { ...empaque };
    delete dataToUpdate.id;
    return this.prisma.empaque.update({
      where: { id },
      data: dataToUpdate,
    }) as unknown as EmpaqueEntity;
  }

  async buscarPorId(id: bigint): Promise<EmpaqueEntity | null> {
    return this.prisma.empaque.findUnique({
      where: { id },
    }) as unknown as EmpaqueEntity | null;
  }

  async buscarPorSku(sku: string): Promise<EmpaqueEntity | null> {
    return this.prisma.empaque.findUnique({
      where: { sku },
    }) as unknown as EmpaqueEntity | null;
  }

  async listarPorVariante(variante_id: bigint): Promise<EmpaqueEntity[]> {
    return this.prisma.empaque.findMany({
      where: { variante_id },
      orderBy: { creado_en: 'asc' },
    }) as unknown as EmpaqueEntity[];
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.empaque.delete({ where: { id } });
  }

  async crearMultiples(
    empaques: Partial<EmpaqueEntity>[],
  ): Promise<EmpaqueEntity[]> {
    if (empaques.length === 0) return [];

    // Prisma no soporta createManyAndReturn en SQLite, pero Postgres sí.
    // Asumiendo que usamos postgres, usamos createManyAndReturn si está disponible.
    // Sin embargo, si la versión no lo soporta, podemos usar una transacción con create.
    const results = await this.prisma.$transaction(
      empaques.map((e) =>
        this.prisma.empaque.create({
          data: {
            variante_id: e.variante_id!,
            nombre: e.nombre!,
            sku: e.sku!,
            codigo_barras: e.codigo_barras,
            multiplicador_unidades: e.multiplicador_unidades ?? 1,
            precio: e.precio!,
            precio_promocional: e.precio_promocional,
            activo: e.activo ?? true,
          },
        }),
      ),
    );
    return results as unknown as EmpaqueEntity[];
  }
}
