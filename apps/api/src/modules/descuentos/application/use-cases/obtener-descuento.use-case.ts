import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';
import { DESCUENTO_REPOSITORY } from '../../domain/repositories/descuento.repository.interface';
import { toDescuentoDto } from '../mappers/descuento.mapper';

@Injectable()
export class ObtenerDescuentoUseCase {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async execute(id: string) {
    const descuento = await this.descuentoRepo.buscarPorId(id);
    if (!descuento) {
      throw new NotFoundException('Descuento no encontrado');
    }
    return { success: true, data: toDescuentoDto(descuento) };
  }
}
