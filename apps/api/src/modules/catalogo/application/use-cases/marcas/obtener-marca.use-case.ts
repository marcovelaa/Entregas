import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMarcaRepository } from '../../../domain/repositories/marca.repository.interface';
import { MARCA_REPOSITORY } from '../../../domain/repositories/marca.repository.interface';

@Injectable()
export class ObtenerMarcaUseCase {
  constructor(
    @Inject(MARCA_REPOSITORY)
    private readonly marcaRepo: IMarcaRepository,
  ) {}

  async execute(id: bigint) {
    const marca = await this.marcaRepo.buscarPorId(id);
    if (!marca) {
      throw new NotFoundException(`Marca con id ${id} no encontrada`);
    }
    return marca;
  }
}
