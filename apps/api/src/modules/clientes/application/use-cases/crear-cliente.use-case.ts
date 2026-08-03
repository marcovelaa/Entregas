import { IClienteRepository, ClienteCreateData } from '../../domain/repositories/cliente.repository.interface';

export class CrearClienteUseCase {
  constructor(private readonly clienteRepo: IClienteRepository) {}

  async execute(data: ClienteCreateData) {
    return { data: await this.clienteRepo.crear(data) };
  }
}
