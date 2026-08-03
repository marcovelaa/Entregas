export const PERMISO_REPOSITORY = Symbol('PERMISO_REPOSITORY');
export interface IPermisoRepository {
  findAll(): Promise<{codigo: string, descripcion: string}[]>;
}
