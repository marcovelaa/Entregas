import { NotFoundException } from '@nestjs/common';
import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { Rol } from '../../../domain/entities/rol.entity';
import { UpdateRolDto } from '../../dtos/update-rol.dto';

export class EditarRolUseCase {
  constructor(private readonly rolRepository: IRolRepository) {}

  async execute(id: bigint, dto: UpdateRolDto): Promise<Rol> {
    const rol = await this.rolRepository.findById(id);
    if (!rol) {
      throw new NotFoundException(`El rol con ID ${id} no existe.`);
    }

    rol.actualizar(dto.nombre, dto.descripcion);
    if (dto.activo !== undefined) {
      dto.activo ? rol.activar() : rol.desactivar();
    }

    return await this.rolRepository.update(rol);
  }
}
