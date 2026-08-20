import { DescuentoEntity } from '../../domain/repositories/descuento.repository.interface';

export type DescuentoDto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  codigoCupon: string | null;
  tipo: string;
  valor: number;
  maxMontoDescuento: number | null;
  alcance: string;
  canal: string;
  cantidadRequerida: number;
  cantidadPaga: number;
  montoMinimoCompra: number | null;
  limiteUsos: number | null;
  limiteUsosPorCliente: number | null;
  usosActuales: number;
  prioridad: number;
  fechaInicio: Date;
  fechaFin: Date;
  activo: boolean;
  diasSemana: number[];
  horaInicio: string | null;
  horaFin: string | null;
  productos: { id: string; nombre: string }[];
  variantes: { id: string; nombre: string }[];
  empaques: { id: string; nombre: string }[];
  categorias: { id: string; nombre: string }[];
};

/** Mapea la entidad de dominio al contrato HTTP camelCase vigente del módulo descuentos. */
export function toDescuentoDto(d: DescuentoEntity): DescuentoDto {
  return {
    id: d.id,
    nombre: d.nombre,
    descripcion: d.descripcion,
    codigoCupon: d.codigo_cupon,
    tipo: d.tipo,
    valor: d.valor,
    maxMontoDescuento: d.max_monto_descuento,
    alcance: d.alcance,
    canal: d.canal,
    cantidadRequerida: d.cantidad_requerida,
    cantidadPaga: d.cantidad_paga,
    montoMinimoCompra: d.monto_minimo_compra,
    limiteUsos: d.limite_usos,
    limiteUsosPorCliente: d.limite_usos_por_cliente,
    usosActuales: d.usos_actuales,
    prioridad: d.prioridad,
    fechaInicio: d.fecha_inicio,
    fechaFin: d.fecha_fin,
    activo: d.activo,
    diasSemana: d.dias_semana,
    horaInicio: d.hora_inicio,
    horaFin: d.hora_fin,
    productos: d.productos,
    variantes: d.variantes,
    empaques: d.empaques,
    categorias: d.categorias,
  };
}
