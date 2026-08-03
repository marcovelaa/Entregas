import { NotFoundException } from '@nestjs/common';
import type { IProveedorRepository } from '../../domain/repositories/proveedor.repository.interface';
import { ActualizarProveedorDto } from '../dtos/proveedor.dto';

export class ActualizarProveedorUseCase {
  constructor(private readonly proveedorRepository: IProveedorRepository) {}

  async execute(id: bigint, dto: ActualizarProveedorDto) {
    const proveedor = await this.proveedorRepository.buscarPorId(id);
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return this.proveedorRepository.actualizar(id, dto);
  }
}
