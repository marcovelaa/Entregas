import { IDireccionRepository, DireccionCreateData } from '../../../domain/repositories/direccion.repository.interface';

export class CrearDireccionUseCase {
  constructor(private readonly direccionRepo: IDireccionRepository) {}

  async execute(clienteId: string, data: DireccionCreateData) {
    return this.direccionRepo.crear(clienteId, data);
  }
}
