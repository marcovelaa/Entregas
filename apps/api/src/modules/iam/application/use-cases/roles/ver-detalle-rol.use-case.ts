import { NotFoundException } from '@nestjs/common';
import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { Rol } from '../../../domain/entities/rol.entity';

export class VerDetalleRolUseCase {
  constructor(private readonly rolRepository: IRolRepository) {}

  async execute(id: bigint): Promise<Rol> {
    const rol = await this.rolRepository.findById(id);
    if (!rol) {
      throw new NotFoundException(`El rol con ID ${id} no existe.`);
    }
    return rol;
  }
}
