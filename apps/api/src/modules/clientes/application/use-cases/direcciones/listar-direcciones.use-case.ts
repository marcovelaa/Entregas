import { IDireccionRepository } from '../../../domain/repositories/direccion.repository.interface';

export class ListarDireccionesUseCase {
  constructor(private readonly direccionRepo: IDireccionRepository) {}

  async execute(clienteId: string) {
    return this.direccionRepo.listarPorCliente(clienteId);
  }
}
