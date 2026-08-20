import { Inject, Injectable } from '@nestjs/common';
import type { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';
import { DESCUENTO_REPOSITORY } from '../../domain/repositories/descuento.repository.interface';
import { toDescuentoDto } from '../mappers/descuento.mapper';

@Injectable()
export class ListarDescuentosUseCase {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async execute() {
    const descuentos = await this.descuentoRepo.buscarTodos();
    return { success: true, data: descuentos.map(toDescuentoDto) };
  }
}
