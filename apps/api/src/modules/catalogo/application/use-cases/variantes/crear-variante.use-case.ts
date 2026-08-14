import { IVarianteRepository } from '../../../domain/repositories/variante.repository.interface';
import { CrearVarianteDto } from '../../dtos/variante.dto';
import { BadRequestException } from '@nestjs/common';

export class CrearVarianteUseCase {
  constructor(private readonly varianteRepo: IVarianteRepository) {}

  async execute(dto: CrearVarianteDto) {
    const existing = await this.varianteRepo.buscarPorSku(dto.sku_base);
    if (existing) {
      throw new BadRequestException(
        `La variante con SKU ${dto.sku_base} ya existe.`,
      );
    }

    const createData: any = { ...dto };
    createData.producto_id = BigInt(dto.producto_id);
    return this.varianteRepo.crear(createData);
  }
}
