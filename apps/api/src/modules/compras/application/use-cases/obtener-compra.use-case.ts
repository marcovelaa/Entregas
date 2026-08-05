import { NotFoundException } from '@nestjs/common';
import { ICompraRepository } from '../../domain/repositories/compra.repository.interface';

export class ObtenerCompraUseCase {
  constructor(private readonly compraRepo: ICompraRepository) {}

  async execute(id: string) {
    const compra = await this.compraRepo.obtenerPorId(id);
    if (!compra) throw new NotFoundException('Compra no encontrada');
    return { data: compra };
  }
}
