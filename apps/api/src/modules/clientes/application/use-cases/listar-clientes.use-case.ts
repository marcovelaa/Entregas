import { IClienteRepository } from '../../domain/repositories/cliente.repository.interface';
import { ListarClientesDto } from '../dtos/cliente.dto';

export class ListarClientesUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute(dto: ListarClientesDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    const { total, data } = await this.clienteRepo.listar({ offset, limit, buscar: dto.buscar });

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
