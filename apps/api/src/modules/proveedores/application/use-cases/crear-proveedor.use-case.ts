import type { IProveedorRepository } from '../../domain/repositories/proveedor.repository.interface';
import { CrearProveedorDto } from '../dtos/proveedor.dto';

export class CrearProveedorUseCase {
  constructor(private readonly proveedorRepository: IProveedorRepository) {}

  async execute(dto: CrearProveedorDto) {
    return this.proveedorRepository.crear(dto);
  }
}
