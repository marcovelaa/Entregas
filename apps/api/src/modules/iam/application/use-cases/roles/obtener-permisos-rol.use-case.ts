import { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
export class ObtenerPermisosRolUseCase {
  constructor(private readonly repo: IRolRepository) {}
  async execute(id: bigint) { return this.repo.getPermisosPorRol(id); }
}
