import type { IProveedorRepository } from '../../domain/repositories/proveedor.repository.interface';
import { ListarProveedoresDto } from '../dtos/proveedor.dto';


export class ListarProveedoresUseCase {
  constructor(private readonly proveedorRepository: IProveedorRepository) {}

  async execute(dto: ListarProveedoresDto) {
    const limit = dto.limit ? parseInt(dto.limit.toString(), 10) : 10;
    const page = dto.page ? parseInt(dto.page.toString(), 10) : 1;
    const offset = (page - 1) * limit;

    const { total, data } = await this.proveedorRepository.listar({ offset, limit });

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
