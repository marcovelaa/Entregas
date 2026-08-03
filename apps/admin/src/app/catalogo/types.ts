export type Marca = { id: string; nombre: string; slug: string; descripcion?: string; activo: boolean };
export type Categoria = { id: string; nombre: string; slug: string; descripcion?: string; activo: boolean; categoria_padre_id?: string; plantilla_atributos?: any[] };
export type Producto = {
  id: string; public_id: string; nombre: string; sku: string; naturaleza?: string;
  tipo_producto?: 'SIMPLE' | 'COMBO' | 'SERVICIO';
  descripcion?: string; precio_base: string; precio_promocional?: string;
  activo: boolean; categoria: Categoria; marca?: Marca; atributos?: Record<string, any>;
  opciones_variantes?: any[];
  componentes_combo?: any[];
  imagenes?: Array<{ id: string; url: string; orden: number; es_principal: boolean }>;
};
export type ActiveTab = 'productos' | 'marcas';
