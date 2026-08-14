import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IVarianteRepository } from '../../../domain/repositories/variante.repository.interface';
import { VARIANTE_REPOSITORY } from '../../../domain/repositories/variante.repository.interface';
import { ActualizarVarianteDto } from '../../dtos/variante.dto';

@Injectable()
export class ActualizarVarianteUseCase {
  constructor(
    @Inject(VARIANTE_REPOSITORY)
    private readonly varianteRepo: IVarianteRepository,
  ) {}

  async execute(id: bigint, dto: ActualizarVarianteDto) {
    const variante = await this.varianteRepo.buscarPorId(id);
    if (!variante) {
      throw new NotFoundException(`Variante con id ${id} no encontrada`);
    }

    if (dto.sku_base && dto.sku_base !== variante.sku_base) {
      const existente = await this.varianteRepo.buscarPorSku(dto.sku_base);
      if (existente) {
        throw new BadRequestException(
          `Ya existe una variante con el SKU '${dto.sku_base}'`,
        );
      }
    }

    return this.varianteRepo.actualizar(id, dto);
  }
}
