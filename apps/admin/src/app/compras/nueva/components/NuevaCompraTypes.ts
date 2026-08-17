export interface Producto {
  id: string;
  nombre: string;
  sku: string;
  precio_base: number | string;
  precio_promocional?: number | string;
}

export interface Variante {
  id: string;
  nombre: string;
  sku_base?: string;
  precio?: number | string;
}

export interface Empaque {
  id: string;
  nombre: string;
  multiplicador_unidades: number;
  precio?: number | string;
  precio_promocional?: number | string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
}

export interface CartItem {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_sku: string;
  variante_id?: string;
  variante_nombre?: string;
  empaque_id?: string;
  empaque_nombre?: string;
  multiplicador: number;
  cantidad: number;
  costo_unitario: number;
  precio_venta?: number;
  subtotal: number;
}
