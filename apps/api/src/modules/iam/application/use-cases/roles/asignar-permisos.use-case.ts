import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
export class AsignarPermisosUseCase {
  constructor(private readonly repo: IRolRepository) {}
  async execute(id: bigint, permisos: string[]) {
    await this.repo.asignarPermisos(id, permisos);
  }
}
