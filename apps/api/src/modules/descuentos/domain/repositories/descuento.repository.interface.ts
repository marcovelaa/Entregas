export const DESCUENTO_REPOSITORY = 'DESCUENTO_REPOSITORY';

export type ReglaDescuentoVigente = {
  id: string;
  nombre: string;
  codigo_cupon: string | null;
  tipo: string;
  alcance: string;
  canal: string;
  valor: number;
  max_monto_descuento: number | null;
  cantidad_requerida: number | null;
  cantidad_paga: number | null;
  monto_minimo_compra: number | null;
  limite_usos: number | null;
  limite_usos_por_cliente: number | null;
  usos_actuales: number;
  prioridad: number;
  dias_semana: number[];
  hora_inicio: string | null;
  hora_fin: string | null;
  productos: { producto_id: string }[];
  variantes: { variante_id: string }[];
  empaques: { empaque_id: string }[];
  categorias: { categoria_id: string }[];
};

export type DescuentoPorCupon = {
  activo: boolean;
  fecha_inicio: Date;
  fecha_fin: Date;
  dias_semana: number[];
};

export type DescuentoRelacionRef = { id: string; nombre: string };

/** Forma de dominio de un Descuento, con relaciones ya aplanadas (sin shape crudo de Prisma). */
export type DescuentoEntity = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigo_cupon: string | null;
  tipo: string;
  valor: number;
  max_monto_descuento: number | null;
  alcance: string;
  canal: string;
  cantidad_requerida: number;
  cantidad_paga: number;
  monto_minimo_compra: number | null;
  limite_usos: number | null;
  limite_usos_por_cliente: number | null;
  usos_actuales: number;
  prioridad: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  activo: boolean;
  dias_semana: number[];
  hora_inicio: string | null;
  hora_fin: string | null;
  productos: DescuentoRelacionRef[];
  variantes: DescuentoRelacionRef[];
  empaques: DescuentoRelacionRef[];
  categorias: DescuentoRelacionRef[];
};

export type DescuentoRelacionesInput = {
  productoIds?: string[];
  varianteIds?: string[];
  empaqueIds?: string[];
  categoriaIds?: string[];
};

export type DescuentoCrearInput = {
  nombre: string;
  descripcion?: string | null;
  codigo_cupon?: string | null;
  tipo: string;
  valor: number;
  max_monto_descuento?: number | null;
  alcance: string;
  canal: string;
  cantidad_requerida: number;
  cantidad_paga: number;
  monto_minimo_compra?: number | null;
  limite_usos?: number | null;
  limite_usos_por_cliente: number;
  prioridad: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  dias_semana: number[];
  hora_inicio: string | null;
  hora_fin: string | null;
} & DescuentoRelacionesInput;

export type DescuentoActualizarParcialInput = Partial<{
  activo: boolean;
  nombre: string;
  descripcion: string;
  prioridad: number;
  valor: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  dias_semana: number[];
  hora_inicio: string | null;
  hora_fin: string | null;
}>;

/** Solo los campos efectivamente provistos por el cliente; Prisma deja intactas las columnas omitidas. */
export type DescuentoActualizarCompletoInput = Partial<{
  nombre: string;
  descripcion: string | null;
  codigo_cupon: string | null;
  tipo: string;
  valor: number;
  max_monto_descuento: number | null;
  alcance: string;
  canal: string;
  cantidad_requerida: number;
  cantidad_paga: number;
  monto_minimo_compra: number | null;
  limite_usos: number | null;
  limite_usos_por_cliente: number;
  prioridad: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  activo: boolean;
  dias_semana: number[];
  hora_inicio: string | null;
  hora_fin: string | null;
}> &
  DescuentoRelacionesInput;

export type DescuentoUsoDetalle = {
  id: string;
  ventaId: string;
  clienteNombre: string;
  montoDescontado: number;
  montoVenta: number;
  fecha: Date;
  productos: {
    id: string;
    nombre: string;
    cantidad: number;
    subtotal: number;
  }[];
};

export interface IDescuentoRepository {
  /** Descuentos activos, vigentes por fecha, y con el código de cupón indicado (o sin cupón). */
  buscarReglasVigentes(params: {
    now: Date;
    codigoCupon?: string;
  }): Promise<ReglaDescuentoVigente[]>;
  /** Cuántas veces un cliente ya usó un descuento, para el límite de uso por cliente. */
  contarUsosPorCliente(descuentoId: string, clienteId: string): Promise<number>;
  /** Busca un descuento por su código de cupón sin filtrar por vigencia/actividad, para explicar por qué no aplicó. */
  buscarDescuentoPorCupon(
    codigoCupon: string,
  ): Promise<DescuentoPorCupon | null>;

  buscarTodos(): Promise<DescuentoEntity[]>;
  buscarPorId(id: string): Promise<DescuentoEntity | null>;
  crear(datos: DescuentoCrearInput): Promise<DescuentoEntity>;
  actualizarParcial(
    id: string,
    datos: DescuentoActualizarParcialInput,
  ): Promise<DescuentoEntity | null>;
  /** Devuelve false si el descuento no existía (no-op), true si se actualizó. */
  actualizarCompleto(
    id: string,
    datos: DescuentoActualizarCompletoInput,
    reemplazarRelaciones: boolean,
  ): Promise<boolean>;
  eliminar(id: string): Promise<void>;
  /** Historial de canjes de un descuento, con el detalle de productos de cada venta, para la analítica. */
  buscarUsosConDetalle(descuentoId: string): Promise<DescuentoUsoDetalle[]>;
}
