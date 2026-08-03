import { IVentaRepository } from '../../domain/repositories/venta.repository.interface';
import { ListarVentasDto } from '../dtos/venta.dto';

export class ListarVentasUseCase {
  constructor(private readonly ventaRepo: IVentaRepository) {}

  async execute(dto: ListarVentasDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    const { total, data } = await this.ventaRepo.listar({ offset, limit });

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit)
      }
    };
  }
}
