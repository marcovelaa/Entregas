import { Injectable, Inject } from '@nestjs/common';
import { EMPAQUE_REPOSITORY } from '../../../domain/repositories/empaque.repository.interface';
import type { IEmpaqueRepository } from '../../../domain/repositories/empaque.repository.interface';

@Injectable()
export class ListarEmpaquesPorVarianteUseCase {
  constructor(
    @Inject(EMPAQUE_REPOSITORY)
    private readonly empaqueRepo: IEmpaqueRepository,
  ) {}

  async execute(variante_id: bigint) {
    return this.empaqueRepo.listarPorVariante(variante_id);
  }
}
