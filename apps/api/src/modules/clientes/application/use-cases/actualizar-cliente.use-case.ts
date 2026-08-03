import { IClienteRepository, ClienteUpdateData } from '../../domain/repositories/cliente.repository.interface';

export class ActualizarClienteUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute(id: string, data: ClienteUpdateData) {
    return { data: await this.clienteRepo.actualizar(id, data) };
  }
}
