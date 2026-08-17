export interface Producto {
  id: string;
  nombre: string;
  sku: string;
}

export interface Variante {
  id: string;
  nombre: string;
  sku_base: string;
}

export interface Usuario {
  id: string;
  nombres: string;
  apellidos: string;
}

export interface StockItem {
  id: string;
  producto_id: string;
  variante_id?: string;
  ubicacion?: string;
  cantidad_disponible: number;
  reservado: number;
  stock_minimo?: number;
  producto: Producto;
  variante?: Variante;
}

export interface MovimientoItem {
  id: string;
  creado_en: string;
  tipo_movimiento: string;
  cantidad: number;
  motivo: string;
  producto: Producto;
  variante?: Variante;
  usuario?: Usuario;
}
