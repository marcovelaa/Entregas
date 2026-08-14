import { IInventarioRepository } from '../../domain/repositories/inventario.repository.interface';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class ListarStockUseCase {
  constructor(private readonly inventarioRepo: IInventarioRepository) {}

  async execute(dto: PaginationDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    const { total, data } = await this.inventarioRepo.listarStock({
      offset,
      limit,
    });

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
