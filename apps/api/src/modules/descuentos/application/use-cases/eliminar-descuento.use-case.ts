import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';
import { DESCUENTO_REPOSITORY } from '../../domain/repositories/descuento.repository.interface';

@Injectable()
export class EliminarDescuentoUseCase {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async execute(id: string) {
    const descuento = await this.descuentoRepo.buscarPorId(id);
    if (!descuento) {
      throw new NotFoundException('Descuento no encontrado');
    }
    await this.descuentoRepo.eliminar(id);
    return { success: true, message: 'Descuento eliminado' };
  }
}
