import { EstadoPedido } from '../entities/estado-pedido.enum';

export interface DireccionEnvioSnapshot {
  destinatario_nombre: string;
  destinatario_apellidos: string;
  direccion_completa: string;
  ciudad: string;
  telefono: string;
  referencia?: string | null;
}

export interface PedidoDetalleCreateData {
  producto_id: string;
  variante_id?: string | null;
  empaque_id?: string | null;
  nombre_producto: string;
  sku?: string | null;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  imagen_url?: string | null;
}

export interface PedidoCreateData {
  cliente_id?: string | null;
  reserva_id?: string | null;
  direccion_envio_snapshot: DireccionEnvioSnapshot;
  costo_envio: number;
  subtotal: number;
  descuento_total: number;
  total: number;
  metodo_pago?: string;
  notas?: string | null;
  detalles: PedidoDetalleCreateData[];
}

export interface PedidoDetalleData {
  id: string;
  producto_id: string;
  variante_id?: string | null;
  empaque_id?: string | null;
  nombre_producto: string;
  sku?: string | null;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  imagen_url?: string | null;
}

export interface PedidoHistorialData {
  id: string;
  estado_anterior?: string | null;
  estado_nuevo: string;
  cambiado_por_usuario_id?: string | null;
  cambiado_por_cliente_id?: string | null;
  motivo?: string | null;
  creado_en: Date;
}

export interface PedidoData {
  id: string;
  numero_pedido: string;
  cliente_id: string | null;
  reserva_id: string | null;
  preparador_id?: string | null;
  repartidor_id?: string | null;
  nombre_preparador?: string | null;
  nombre_repartidor?: string | null;
  estado: EstadoPedido;
  direccion_envio_snapshot: DireccionEnvioSnapshot;
  costo_envio: number;
  subtotal: number;
  descuento_total: number;
  total: number;
  metodo_pago: string;
  notas?: string | null;
  creado_en: Date;
  actualizado_en: Date;
  detalles: PedidoDetalleData[];
  historialEstado?: PedidoHistorialData[];
}

export const PEDIDO_REPOSITORY = 'PEDIDO_REPOSITORY';

export interface IPedidoRepository {
  crear(data: PedidoCreateData): Promise<PedidoData>;
  obtenerPorId(id: string): Promise<PedidoData | null>;
  obtenerPorNumeroPedido(numeroPedido: string): Promise<PedidoData | null>;
  listarPorCliente(clienteId: string): Promise<PedidoData[]>;
  listarErp(params: {
    offset: number;
    limit: number;
    estado?: EstadoPedido;
    buscar?: string;
  }): Promise<{ total: number; data: PedidoData[] }>;
  actualizarEstado(
    pedidoId: string,
    nuevoEstado: EstadoPedido,
    historial: {
      estadoAnterior: EstadoPedido;
      cambiadoPorUsuarioId?: string | null;
      cambiadoPorClienteId?: string | null;
      motivo?: string | null;
      costoEnvio?: number;
    },
  ): Promise<PedidoData>;
}
