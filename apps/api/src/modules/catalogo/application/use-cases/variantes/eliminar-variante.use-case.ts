import { ConflictException, NotFoundException } from '@nestjs/common';
import type { IVarianteRepository } from '../../../domain/repositories/variante.repository.interface';

export class EliminarVarianteUseCase {
  constructor(private readonly varianteRepository: IVarianteRepository) {}

  async execute(id: bigint): Promise<void> {
    const variante = await this.varianteRepository.buscarPorId(id);
    if (!variante) {
      throw new NotFoundException('Presentación no encontrada');
    }

    const count = await this.varianteRepository.contarDependencias(id);
    if (count > 0) {
      throw new ConflictException(
        `No se puede eliminar la presentación porque tiene stock o movimientos de inventario asociados. Por favor, desactívela.`,
      );
    }

    await this.varianteRepository.eliminar(id);
  }
}
