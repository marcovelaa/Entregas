import { ModoVenta, CanalVenta } from '@prisma/client';

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
  modo_venta?: ModoVenta;
  vigencia_inicio?: Date | null;
  vigencia_fin?: Date | null;
  cupo_maximo?: number | null;
  cupo_usado?: number;
  dias_semana?: number[];
  canal_venta?: CanalVenta;
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
  visibilidad?: 'publica' | 'admin';
  search?: string;
}

export interface InventarioStockRow {
  producto_id: bigint;
  variante_id: bigint | null;
  cantidad_disponible: number;
  reservado: number;
}

export type ProductoCrearInput = Omit<Partial<ProductoEntity>, 'cupo_usado'> & {
  componentes_combo?: any[];
};

export type ProductoActualizarInput = Omit<
  Partial<ProductoEntity>,
  'cupo_usado'
> & {
  componentes_combo?: any[];
};

export interface IProductoRepository {
  crear(producto: ProductoCrearInput): Promise<ProductoEntity>;
  buscarTodos(
    filtros?: ProductoFiltros,
    page?: number,
    limit?: number,
  ): Promise<{ data: ProductoEntity[]; total: number }>;
  buscarPorId(id: bigint): Promise<ProductoEntity | null>;
  buscarPorPublicId(publicId: string): Promise<ProductoEntity | null>;
  buscarPorSku(sku: string): Promise<ProductoEntity | null>;
  buscarStocksComponentes(ids: bigint[]): Promise<InventarioStockRow[]>;
  actualizar(
    id: bigint,
    datos: ProductoActualizarInput,
  ): Promise<ProductoEntity>;
  /** Actualiza únicamente el precio base del producto (ej. desde una compra). Participa en `tx` si se provee. */
  actualizarPrecioVenta(id: bigint, precio: number, tx?: any): Promise<void>;
  desactivar(id: bigint): Promise<ProductoEntity>;
  eliminar(id: bigint): Promise<void>;
  contarVariantesAsociadas(id: bigint): Promise<number>;
}
