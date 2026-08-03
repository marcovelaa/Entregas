import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { EMPAQUE_REPOSITORY } from '../../../domain/repositories/empaque.repository.interface';
import type { IEmpaqueRepository } from '../../../domain/repositories/empaque.repository.interface';
import { ActualizarEmpaqueDto } from '../../dtos/empaque.dto';

@Injectable()
export class ActualizarEmpaqueUseCase {
  constructor(
    @Inject(EMPAQUE_REPOSITORY)
    private readonly empaqueRepo: IEmpaqueRepository,
  ) {}

  async execute(id: bigint, dto: ActualizarEmpaqueDto) {
    const empaque = await this.empaqueRepo.buscarPorId(id);
    if (!empaque) {
      throw new NotFoundException(`Empaque con id ${id} no encontrado`);
    }

    if (dto.sku && dto.sku !== empaque.sku) {
      const existente = await this.empaqueRepo.buscarPorSku(dto.sku);
      if (existente) {
        throw new BadRequestException(`El SKU '${dto.sku}' ya está en uso`);
      }
    }

    return this.empaqueRepo.actualizar(id, dto);
  }
}
