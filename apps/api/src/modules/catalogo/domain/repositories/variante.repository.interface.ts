export const VARIANTE_REPOSITORY = 'VARIANTE_REPOSITORY';

export interface VarianteEntity {
  id: bigint;
  producto_id: bigint;
  nombre: string;
  sku_base: string;
  precio_unitario?: any;
  precio_promocional?: any | null;
  imagen_url?: string | null;
  activo: boolean;
  creado_en?: Date;
  actualizado_en?: Date;
}

export interface IVarianteRepository {
  crear(variante: Partial<VarianteEntity>): Promise<VarianteEntity>;
  buscarPorProducto(productoId: bigint): Promise<VarianteEntity[]>;
  buscarPorId(id: bigint): Promise<VarianteEntity | null>;
  buscarPorSku(sku_base: string): Promise<VarianteEntity | null>;
  actualizar(id: bigint, datos: Partial<VarianteEntity>): Promise<VarianteEntity>;
  /** Actualiza únicamente el precio de venta de la variante (ej. desde una compra). Participa en `tx` si se provee. */
  actualizarPrecioVenta(id: bigint, precio: number, tx?: any): Promise<void>;
  desactivar(id: bigint): Promise<VarianteEntity>;
  eliminar(id: bigint): Promise<void>;
  contarDependencias(id: bigint): Promise<number>;
}
