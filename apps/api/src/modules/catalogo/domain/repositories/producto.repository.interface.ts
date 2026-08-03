export const PRODUCTO_REPOSITORY = 'PRODUCTO_REPOSITORY';

export interface ProductoEntity {
  id: bigint;
  public_id: string;
  categoria_id: bigint;
  marca_id?: bigint | null;
  sku: string;
  nombre: string;
  descripcion?: string | null;
  naturaleza?: string | null;
  tipo_producto?: 'SIMPLE' | 'COMBO' | 'SERVICIO';
  unidad_medida: string;
  atributos: any;
  precio_base: any;
  precio_promocional?: any | null;
  activo: boolean;
  creado_en?: Date;
  actualizado_en?: Date;
  componentes_combo?: any[];
}

export interface ProductoFiltros {
  activo?: boolean;
  categoria_id?: bigint;
  marca_id?: bigint;
  tipo_producto?: 'SIMPLE' | 'COMBO' | 'SERVICIO';
  search?: string;
}

export interface IProductoRepository {
  crear(producto: Partial<ProductoEntity>): Promise<ProductoEntity>;
  buscarTodos(filtros?: ProductoFiltros, page?: number, limit?: number): Promise<{ data: ProductoEntity[]; total: number }>;
  buscarPorId(id: bigint): Promise<ProductoEntity | null>;
  buscarPorPublicId(publicId: string): Promise<ProductoEntity | null>;
  buscarPorSku(sku: string): Promise<ProductoEntity | null>;
  actualizar(id: bigint, datos: Partial<ProductoEntity>): Promise<ProductoEntity>;
  desactivar(id: bigint): Promise<ProductoEntity>;
  eliminar(id: bigint): Promise<void>;
  contarVariantesAsociadas(id: bigint): Promise<number>;
}
