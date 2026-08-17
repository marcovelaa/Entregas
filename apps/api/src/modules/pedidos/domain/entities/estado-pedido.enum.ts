export enum EstadoPedido {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PAGADO = 'PAGADO',
  EN_PREPARACION = 'EN_PREPARACION',
  ENVIADO = 'ENVIADO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

export const TRANSICIONES_PERMITIDAS: Record<EstadoPedido, EstadoPedido[]> = {
  [EstadoPedido.PENDIENTE_PAGO]: [EstadoPedido.PAGADO, EstadoPedido.CANCELADO],
  [EstadoPedido.PAGADO]: [EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO],
  [EstadoPedido.EN_PREPARACION]: [EstadoPedido.PAGADO, EstadoPedido.ENVIADO, EstadoPedido.CANCELADO],
  [EstadoPedido.ENVIADO]: [EstadoPedido.EN_PREPARACION, EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO],
  [EstadoPedido.ENTREGADO]: [EstadoPedido.ENVIADO, EstadoPedido.CANCELADO],
  [EstadoPedido.CANCELADO]: [EstadoPedido.PAGADO],
};

export function esTransicionValida(
  actual: EstadoPedido,
  nuevo: EstadoPedido,
): boolean {
  if (actual === nuevo) return true;
  const permitidos = TRANSICIONES_PERMITIDAS[actual] || [];
  return permitidos.includes(nuevo);
}
