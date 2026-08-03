import { Injectable, Inject } from '@nestjs/common';
import type { IVarianteRepository } from '../../../domain/repositories/variante.repository.interface';
import { VARIANTE_REPOSITORY } from '../../../domain/repositories/variante.repository.interface';

@Injectable()
export class ListarVariantesUseCase {
  constructor(
    @Inject(VARIANTE_REPOSITORY)
    private readonly varianteRepo: IVarianteRepository,
  ) {}

  async execute(productoId: string) {
    return this.varianteRepo.buscarPorProducto(BigInt(productoId));
  }
}
