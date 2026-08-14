import { NotFoundException } from '@nestjs/common';
import {
  IDireccionRepository,
  DireccionUpdateData,
} from '../../../domain/repositories/direccion.repository.interface';

export class ActualizarDireccionUseCase {
  constructor(private readonly direccionRepo: IDireccionRepository) {}

  async execute(
    clienteId: string,
    direccionId: string,
    data: DireccionUpdateData,
  ) {
    const actualizada = await this.direccionRepo.actualizar(
      clienteId,
      direccionId,
      data,
    );
    if (!actualizada) {
      throw new NotFoundException('La dirección no existe');
    }
    return actualizada;
  }
}
