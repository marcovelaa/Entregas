import { NotFoundException, Injectable, Inject } from '@nestjs/common';
import type { ICompraRepository } from '../../domain/repositories/compra.repository.interface';
import { COMPRA_REPOSITORY } from '../../domain/repositories/compra.repository.interface';

@Injectable()
export class ObtenerCompraUseCase {
  constructor(
    @Inject(COMPRA_REPOSITORY)
    private readonly compraRepo: ICompraRepository
  ) {}

  async execute(id: string) {
    const compra = await this.compraRepo.obtenerPorId(id);
    if (!compra) throw new NotFoundException('Compra no encontrada');
    return { data: compra };
  }
}
