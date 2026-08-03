import { Injectable, Inject } from '@nestjs/common';
import type { ICategoriaRepository } from '../../../domain/repositories/categoria.repository.interface';
import { CATEGORIA_REPOSITORY, CategoriaEntity } from '../../../domain/repositories/categoria.repository.interface';
import { ListarCategoriasDto } from '../../dtos/categoria.dto';
import { PaginatedResult } from '../../../../../common/interfaces/paginated-result.interface';

@Injectable()
export class ListarCategoriasUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY)
    private readonly categoriaRepo: ICategoriaRepository,
  ) {}

  async execute(dto?: ListarCategoriasDto, page = 1, limit = 20): Promise<PaginatedResult<CategoriaEntity>> {
    const { data, total } = await this.categoriaRepo.buscarTodas(
      {
        activo: dto?.activo,
        padre_id: dto?.padre_id ? BigInt(dto.padre_id) : undefined,
      },
      page,
      limit,
    );
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
