import {
  EstadoDevolucion,
  ResolucionDevolucion,
  DestinoFisicoItem,
} from '../entities/devolucion-enums';

export interface DevolucionDetalleCreateData {
  pedido_detalle_id: string;
  producto_id: string;
  cantidad: number;
  motivo_item?: string | null;
}

export interface DevolucionCreateData {
  pedido_id: string;
  cliente_id: string;
  motivo: string;
  detalles: DevolucionDetalleCreateData[];
}

export interface DevolucionDetalleData {
  id: string;
  pedido_detalle_id: string;
  producto_id: string;
  cantidad: number;
  motivo_item?: string | null;
}

export interface DevolucionData {
  id: string;
  public_id: string;
  pedido_id: string;
  cliente_id: string;
  estado: EstadoDevolucion;
  motivo: string;
  resolucion?: ResolucionDevolucion | null;
  destino_fisico?: DestinoFisicoItem | null;
  monto_reembolso?: number | null;
  notas_evaluacion?: string | null;
  evaluado_por_usuario_id?: string | null;
  evaluado_en?: Date | null;
  creado_en: Date;
  actualizado_en: Date;
  detalles: DevolucionDetalleData[];
}

export const DEVOLUCION_REPOSITORY = 'DEVOLUCION_REPOSITORY';

export interface IDevolucionRepository {
  crear(data: DevolucionCreateData): Promise<DevolucionData>;
  obtenerPorId(id: string): Promise<DevolucionData | null>;
  listarPorCliente(clienteId: string): Promise<DevolucionData[]>;
  listarErp(params: {
    offset: number;
    limit: number;
    estado?: EstadoDevolucion;
  }): Promise<{ total: number; data: DevolucionData[] }>;
  evaluarYRestock(
    id: string,
    evaluacion: {
      estado: EstadoDevolucion;
      resolucion: ResolucionDevolucion;
      destinoFisico: DestinoFisicoItem;
      montoReembolso?: number | null;
      notasEvaluacion?: string | null;
      evaluadoPorUsuarioId: string;
    },
  ): Promise<DevolucionData>;
}
