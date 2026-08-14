import { ConflictException, NotFoundException } from '@nestjs/common';
import type { IProductoRepository } from '../../../domain/repositories/producto.repository.interface';

export class EliminarProductoUseCase {
  constructor(private readonly productoRepository: IProductoRepository) {}

  async execute(id: bigint): Promise<void> {
    const producto = await this.productoRepository.buscarPorId(id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado');
    }

    const count = await this.productoRepository.contarVariantesAsociadas(id);
    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar el producto porque tiene ${count} variante(s) o presentación(es) asociada(s).`,
      );
    }

    await this.productoRepository.eliminar(id);
  }
}
