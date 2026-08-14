import { NotFoundException } from '@nestjs/common';
import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';

export class EliminarRolUseCase {
  constructor(private readonly rolRepository: IRolRepository) {}

  async execute(id: bigint): Promise<void> {
    const rol = await this.rolRepository.findById(id);
    if (!rol) {
      throw new NotFoundException(`El rol con ID ${id} no existe.`);
    }

    // Aquí podríamos validar si el rol tiene usuarios asignados antes de borrarlo.
    // Como es MVP, lo borramos directo.
    await this.rolRepository.delete(id);
  }
}
