import { EmpaqueEntity } from '../entities/empaque.entity';

export const EMPAQUE_REPOSITORY = Symbol('EMPAQUE_REPOSITORY');

export interface IEmpaqueRepository {
  crear(empaque: Partial<EmpaqueEntity>): Promise<EmpaqueEntity>;
  actualizar(id: bigint, empaque: Partial<EmpaqueEntity>): Promise<EmpaqueEntity>;
  buscarPorId(id: bigint): Promise<EmpaqueEntity | null>;
  buscarPorSku(sku: string): Promise<EmpaqueEntity | null>;
  listarPorVariante(variante_id: bigint): Promise<EmpaqueEntity[]>;
  eliminar(id: bigint): Promise<void>;
  crearMultiples(empaques: Partial<EmpaqueEntity>[]): Promise<EmpaqueEntity[]>;
}
