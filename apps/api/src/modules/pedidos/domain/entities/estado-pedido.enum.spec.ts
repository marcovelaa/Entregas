import {
  EstadoPedido,
  esTransicionValida,
} from './estado-pedido.enum';

describe('EstadoPedido State Machine', () => {
  it('permite mantener el mismo estado', () => {
    expect(
      esTransicionValida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.PENDIENTE_PAGO),
    ).toBe(true);
  });

  it('permite transiciones secuenciales válidas', () => {
    expect(
      esTransicionValida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.PAGADO),
    ).toBe(true);
    expect(
      esTransicionValida(EstadoPedido.PAGADO, EstadoPedido.EN_PREPARACION),
    ).toBe(true);
    expect(
      esTransicionValida(EstadoPedido.EN_PREPARACION, EstadoPedido.ENVIADO),
    ).toBe(true);
    expect(
      esTransicionValida(EstadoPedido.ENVIADO, EstadoPedido.ENTREGADO),
    ).toBe(true);
  });

  it('permite cancelaciones en etapas previas al envío', () => {
    expect(
      esTransicionValida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.CANCELADO),
    ).toBe(true);
    expect(
      esTransicionValida(EstadoPedido.PAGADO, EstadoPedido.CANCELADO),
    ).toBe(true);
    expect(
      esTransicionValida(EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO),
    ).toBe(true);
  });

  it('rechaza transiciones inválidas (saltar pasos o revertir)', () => {
    expect(
      esTransicionValida(EstadoPedido.PENDIENTE_PAGO, EstadoPedido.ENVIADO),
    ).toBe(false);
    expect(
      esTransicionValida(EstadoPedido.ENVIADO, EstadoPedido.PAGADO),
    ).toBe(false);
    expect(
      esTransicionValida(EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO),
    ).toBe(false);
    expect(
      esTransicionValida(EstadoPedido.CANCELADO, EstadoPedido.PAGADO),
    ).toBe(false);
  });
});
