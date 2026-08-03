import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ICategoriaRepository } from '../../../domain/repositories/categoria.repository.interface';
import { CATEGORIA_REPOSITORY } from '../../../domain/repositories/categoria.repository.interface';

@Injectable()
export class ObtenerCategoriaUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
  ) {}

  async execute(id: bigint) {
    const categoria = await this.categoriaRepo.buscarConSubcategorias(id);
    if (!categoria) {
      throw new NotFoundException(`Categoria con id ${id} no encontrada`);
    }
    return categoria;
  }
}
