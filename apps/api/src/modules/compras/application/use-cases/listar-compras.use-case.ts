import { Injectable, Inject } from '@nestjs/common';
import type { ICompraRepository } from '../../domain/repositories/compra.repository.interface';
import { COMPRA_REPOSITORY } from '../../domain/repositories/compra.repository.interface';
import { ListarComprasDto } from '../dtos/compra.dto';

@Injectable()
export class ListarComprasUseCase {
  constructor(
    @Inject(COMPRA_REPOSITORY)
    private readonly compraRepo: ICompraRepository
  ) {}

  async execute(dto: ListarComprasDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    const { total, data } = await this.compraRepo.listar({ offset, limit });

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }
}
