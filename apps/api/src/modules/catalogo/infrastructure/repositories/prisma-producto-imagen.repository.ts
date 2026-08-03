import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IProductoImagenRepository, ProductoImagenEntity } from '../../domain/repositories/producto-imagen.repository.interface';

@Injectable()
export class PrismaProductoImagenRepository implements IProductoImagenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(imagen: Partial<ProductoImagenEntity>): Promise<ProductoImagenEntity> {
    return this.prisma.productoImagen.create({
      data: {
        producto_id: imagen.producto_id!,
        url: imagen.url!,
        texto_alternativo: imagen.texto_alternativo,
        orden: imagen.orden ?? 0,
        es_principal: imagen.es_principal ?? false,
        activo: imagen.activo ?? true,
      },
    }) as unknown as ProductoImagenEntity;
  }

  async actualizar(id: bigint, datos: Partial<ProductoImagenEntity>): Promise<ProductoImagenEntity> {
    return this.prisma.productoImagen.update({
      where: { id },
      data: {
        ...(datos.es_principal !== undefined && { es_principal: datos.es_principal }),
        ...(datos.orden !== undefined && { orden: datos.orden }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
      },
    }) as unknown as ProductoImagenEntity;
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.productoImagen.delete({
      where: { id },
    });
  }

  async desmarcarPrincipales(productoId: bigint): Promise<void> {
    await this.prisma.productoImagen.updateMany({
      where: { producto_id: productoId },
      data: { es_principal: false },
    });
  }
}
