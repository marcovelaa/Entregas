import { Usuario } from '../entities/usuario.entity';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface IUsuarioRepository {
  findById(id: bigint): Promise<Usuario | null>;
  findByPublicId(publicId: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findByCodigoReferido(codigoReferido: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  save(usuario: Usuario): Promise<Usuario>;
  update(usuario: Usuario): Promise<Usuario>;
  delete(id: bigint): Promise<void>;
}
