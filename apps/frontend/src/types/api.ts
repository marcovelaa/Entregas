export interface ApiProduct {
  id: string | number;
  nombre: string;
  naturaleza?: string;
  categoria?: { nombre?: string; slug?: string };
  precio_base: number;
  precio_promocional?: number;
  imagenes?: { url: string }[];
  tipo_producto?: string;
  estado_venta?: string;
  vigencia_fin?: string;
  stock_vendible?: number;
  atributos?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
