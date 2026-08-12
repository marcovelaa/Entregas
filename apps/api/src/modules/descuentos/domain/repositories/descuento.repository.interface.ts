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
}
