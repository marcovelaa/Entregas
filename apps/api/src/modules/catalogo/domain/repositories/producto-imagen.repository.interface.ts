export const PRODUCTO_IMAGEN_REPOSITORY = 'PRODUCTO_IMAGEN_REPOSITORY';

export interface ProductoImagenEntity {
  id: bigint;
  producto_id: bigint;
  url: string;
  texto_alternativo?: string | null;
  orden: number;
  es_principal: boolean;
  activo: boolean;
}

export interface IProductoImagenRepository {
  crear(imagen: Partial<ProductoImagenEntity>): Promise<ProductoImagenEntity>;
  actualizar(
    id: bigint,
    datos: Partial<ProductoImagenEntity>,
  ): Promise<ProductoImagenEntity>;
  eliminar(id: bigint): Promise<void>;
  desmarcarPrincipales(productoId: bigint): Promise<void>;
}
