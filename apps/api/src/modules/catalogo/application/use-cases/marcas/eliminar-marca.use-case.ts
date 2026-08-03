import { ConflictException, NotFoundException } from '@nestjs/common';
import type { IMarcaRepository } from '../../../domain/repositories/marca.repository.interface';

export class EliminarMarcaUseCase {
  constructor(private readonly marcaRepository: IMarcaRepository) {}

  async execute(id: bigint): Promise<void> {
    const marca = await this.marcaRepository.buscarPorId(id);
    if (!marca) {
      throw new NotFoundException('Marca no encontrada');
    }

    const count = await this.marcaRepository.contarProductosAsociados(id);
    if (count > 0) {
      throw new ConflictException(`No se puede eliminar la marca porque tiene ${count} producto(s) asociado(s).`);
    }

    await this.marcaRepository.eliminar(id);
  }
}
