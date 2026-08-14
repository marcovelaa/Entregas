import { NotFoundException } from '@nestjs/common';
import { IDireccionRepository } from '../../../domain/repositories/direccion.repository.interface';

export class MarcarDireccionPrincipalUseCase {
  constructor(private readonly direccionRepo: IDireccionRepository) {}

  async execute(clienteId: string, direccionId: string) {
    const marcada = await this.direccionRepo.marcarPrincipal(
      clienteId,
      direccionId,
    );
    if (!marcada) {
      throw new NotFoundException('La dirección no existe');
    }
  }
}
