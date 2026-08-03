import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EMPAQUE_REPOSITORY } from '../../../domain/repositories/empaque.repository.interface';
import type { IEmpaqueRepository } from '../../../domain/repositories/empaque.repository.interface';
import { CrearEmpaqueDto } from '../../dtos/empaque.dto';

@Injectable()
export class CrearEmpaqueUseCase {
  constructor(
    @Inject(EMPAQUE_REPOSITORY)
    private readonly empaqueRepo: IEmpaqueRepository,
  ) {}

  async execute(dto: CrearEmpaqueDto) {
    const existente = await this.empaqueRepo.buscarPorSku(dto.sku);
    if (existente) {
      throw new BadRequestException(`El SKU '${dto.sku}' ya está en uso`);
    }

    const createData: any = { ...dto };
    createData.variante_id = BigInt(dto.variante_id);
    return this.empaqueRepo.crear(createData);
  }
}
