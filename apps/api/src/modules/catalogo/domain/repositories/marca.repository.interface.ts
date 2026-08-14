export const MARCA_REPOSITORY = 'MARCA_REPOSITORY';

export interface MarcaEntity {
  id: bigint;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  activo: boolean;
  creado_en?: Date;
  actualizado_en?: Date;
}

export interface IMarcaRepository {
  crear(marca: Partial<MarcaEntity>): Promise<MarcaEntity>;
  buscarTodas(
    filtros?: { activo?: boolean },
    page?: number,
    limit?: number,
  ): Promise<{ data: MarcaEntity[]; total: number }>;
  buscarPorId(id: bigint): Promise<MarcaEntity | null>;
  buscarPorSlug(slug: string): Promise<MarcaEntity | null>;
  actualizar(id: bigint, datos: Partial<MarcaEntity>): Promise<MarcaEntity>;
  eliminar(id: bigint): Promise<void>;
  contarProductosAsociados(id: bigint): Promise<number>;
}
