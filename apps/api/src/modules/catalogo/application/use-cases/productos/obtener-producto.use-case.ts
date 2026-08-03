import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';
import { PRODUCTO_REPOSITORY } from '../../../domain/repositories/producto.repository.interface';

@Injectable()
export class ObtenerProductoUseCase {
  constructor(
    @Inject(PRODUCTO_REPOSITORY)
    private readonly productoRepo: IProductoRepository,
  ) {}

  async execute(idOrPublicId: string) {
    let producto: any = null;
    if (/^\d+$/.test(idOrPublicId)) {
      producto = await this.productoRepo.buscarPorId(BigInt(idOrPublicId));
    }
    if (!producto) {
      producto = await this.productoRepo.buscarPorPublicId(idOrPublicId);
    }
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${idOrPublicId} no encontrado`);
    }
    return producto;
  }
}
