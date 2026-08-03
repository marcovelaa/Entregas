import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IVarianteRepository,
  VarianteEntity,
} from '../../domain/repositories/variante.repository.interface';

@Injectable()
export class PrismaVarianteRepository implements IVarianteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(variante: Partial<VarianteEntity>): Promise<VarianteEntity> {
    return this.prisma.variante.create({
      data: {
        producto_id: variante.producto_id!,
        nombre: variante.nombre!,
        sku_base: variante.sku_base!,
                imagen_url: variante.imagen_url,
        activo: variante.activo ?? true,
      },
    }) as unknown as VarianteEntity;
  }

  async buscarPorProducto(productoId: bigint): Promise<VarianteEntity[]> {
    return this.prisma.variante.findMany({
      where: { producto_id: productoId },
      orderBy: { nombre: 'asc' },
    }) as unknown as VarianteEntity[];
  }

  async buscarPorId(id: bigint): Promise<VarianteEntity | null> {
    return this.prisma.variante.findUnique({
      where: { id },
    }) as unknown as VarianteEntity | null;
  }

  async buscarPorSku(sku: string): Promise<VarianteEntity | null> {
    return this.prisma.variante.findUnique({
      where: { sku_base: sku },
    }) as unknown as VarianteEntity | null;
  }

  async actualizar(id: bigint, datos: Partial<VarianteEntity>): Promise<VarianteEntity> {
    return this.prisma.variante.update({
      where: { id },
      data: {
        ...(datos.nombre !== undefined && { nombre: datos.nombre }),
        ...(datos.sku_base !== undefined && { sku_base: datos.sku_base }),
        ...(datos.imagen_url !== undefined && { imagen_url: datos.imagen_url }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      },
    }) as unknown as VarianteEntity;
  }

  async desactivar(id: bigint): Promise<VarianteEntity> {
    return this.prisma.variante.update({
      where: { id },
      data: { activo: false },
    }) as unknown as VarianteEntity;
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.variante.delete({
      where: { id },
    });
  }

  async contarDependencias(id: bigint): Promise<number> {
    const invCount = await this.prisma.inventario.count({ where: { variante_id: id } });
    const movCount = await this.prisma.movimientosInventario.count({ where: { variante_id: id } });
    return invCount + movCount;
  }
}
