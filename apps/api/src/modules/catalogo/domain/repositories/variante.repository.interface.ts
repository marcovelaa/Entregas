export const VARIANTE_REPOSITORY = 'VARIANTE_REPOSITORY';

export interface VarianteEntity {
  id: bigint;
  producto_id: bigint;
  nombre: string;
  sku_base: string;
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
  desactivar(id: bigint): Promise<VarianteEntity>;
  eliminar(id: bigint): Promise<void>;
  contarDependencias(id: bigint): Promise<number>;
}
