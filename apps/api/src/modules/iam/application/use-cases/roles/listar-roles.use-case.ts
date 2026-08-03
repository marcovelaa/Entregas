import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { Rol } from '../../../domain/entities/rol.entity';

export class ListarRolesUseCase {
  constructor(private readonly rolRepository: IRolRepository) {}

  async execute(): Promise<Rol[]> {
    return this.rolRepository.findAll();
  }
}
