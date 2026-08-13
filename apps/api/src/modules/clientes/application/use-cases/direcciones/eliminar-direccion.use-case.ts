import { NotFoundException } from '@nestjs/common';
import { IDireccionRepository } from '../../../domain/repositories/direccion.repository.interface';

export class EliminarDireccionUseCase {
  constructor(private readonly direccionRepo: IDireccionRepository) {}

  async execute(clienteId: string, direccionId: string) {
    const eliminada = await this.direccionRepo.eliminar(clienteId, direccionId);
    if (!eliminada) {
      throw new NotFoundException('La dirección no existe');
    }
  }
}
