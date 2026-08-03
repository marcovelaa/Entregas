export const CATEGORIA_REPOSITORY = 'CATEGORIA_REPOSITORY';

export interface CategoriaEntity {
  id: bigint;
  categoria_padre_id?: bigint | null;
  nombre: string;
  slug: string;
  descripcion?: string | null;
  plantilla_atributos?: any;
  activo: boolean;
  creado_en?: Date;
  actualizado_en?: Date;
}

export interface CategoriaConSubcategorias extends CategoriaEntity {
  subcategorias: CategoriaEntity[];
}

export interface ICategoriaRepository {
  crear(categoria: Partial<CategoriaEntity>): Promise<CategoriaEntity>;
  actualizar(id: bigint, categoria: Partial<CategoriaEntity>): Promise<CategoriaEntity>;
  buscarPorSlug(slug: string): Promise<CategoriaEntity | null>;
  buscarPorId(id: bigint): Promise<CategoriaEntity | null>;
  buscarTodas(filtros?: { activo?: boolean; padre_id?: bigint | null }, page?: number, limit?: number): Promise<{ data: CategoriaEntity[]; total: number }>;
  buscarConSubcategorias(id: bigint): Promise<CategoriaConSubcategorias | null>;
}
