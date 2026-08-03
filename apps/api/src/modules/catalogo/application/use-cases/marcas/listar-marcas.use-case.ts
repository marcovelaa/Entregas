import { Injectable, Inject } from '@nestjs/common';
import type { IMarcaRepository } from '../../../domain/repositories/marca.repository.interface';
import { MARCA_REPOSITORY, MarcaEntity } from '../../../domain/repositories/marca.repository.interface';
import { ListarMarcasDto } from '../../dtos/crear-marca.dto';
import { PaginatedResult } from '../../../../../common/interfaces/paginated-result.interface';

@Injectable()
export class ListarMarcasUseCase {
  constructor(
    @Inject(MARCA_REPOSITORY)
    private readonly marcaRepo: IMarcaRepository,
  ) {}

  async execute(dto?: ListarMarcasDto, page = 1, limit = 20): Promise<PaginatedResult<MarcaEntity>> {
    const { data, total } = await this.marcaRepo.buscarTodas(
      { activo: dto?.activo },
      page,
      limit,
    );
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
