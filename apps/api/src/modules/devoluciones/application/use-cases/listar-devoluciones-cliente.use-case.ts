import { Inject, Injectable } from '@nestjs/common';
import {
  DEVOLUCION_REPOSITORY,
  type IDevolucionRepository,
  type DevolucionData,
} from '../../domain/repositories/devolucion.repository.interface';

@Injectable()
export class ListarDevolucionesClienteUseCase {
  constructor(
    @Inject(DEVOLUCION_REPOSITORY)
    private readonly devolucionRepo: IDevolucionRepository,
  ) {}

  async execute(clienteId: string): Promise<DevolucionData[]> {
    return this.devolucionRepo.listarPorCliente(clienteId);
  }
}
