import { Rol } from '../entities/rol.entity';

export const ROL_REPOSITORY = Symbol('ROL_REPOSITORY');

export interface IRolRepository {
  findById(id: bigint): Promise<Rol | null>;
  findByNombre(nombre: string): Promise<Rol | null>;
  findAll(): Promise<Rol[]>;
  save(rol: Rol): Promise<Rol>;
  update(rol: Rol): Promise<Rol>;
  delete(id: bigint): Promise<void>;
  getPermisosPorRol(id: bigint): Promise<string[]>;
  asignarPermisos(id: bigint, permisos: string[]): Promise<void>;
}
