import { IPermisoRepository } from '../../../domain/repositories/permiso.repository.interface';
export class ListarPermisosUseCase {
  constructor(private readonly repo: IPermisoRepository) {}
  async execute() {
    return this.repo.findAll();
  }
}
