export interface EmpaqueEntity {
  id: bigint;
  variante_id: bigint;
  nombre: string;
  sku: string;
  codigo_barras?: string | null;
  multiplicador_unidades: number;
  precio: number;
  precio_promocional?: number | null;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
}
