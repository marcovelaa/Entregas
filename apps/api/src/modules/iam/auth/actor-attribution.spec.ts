import { ComprasController } from '../../compras/infrastructure/controllers/compras.controller';
import { InventarioController } from '../../inventario/infrastructure/controllers/inventario.controller';
import { VentasController } from '../../ventas/infrastructure/controllers/ventas.controller';
import { UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedUser } from './decorators/current-user.decorator';

describe('Actor Attribution Guardrails', () => {
  const user: AuthenticatedUser = {
    id: '42',
    publicId: 'user-public-id-42',
    email: 'operator@example.test',
    rolId: '1',
    rolNombre: 'ADMIN',
    permisos: [],
  };

  it('attaches the authenticated user ID to write use cases from controller endpoints', async () => {
    const registrarVenta = { execute: jest.fn() };
    const anularVenta = { execute: jest.fn() };
    const revertirVenta = { execute: jest.fn() };
    const reservations = { cancel: jest.fn() };
    const registrarMovimiento = { execute: jest.fn() };
    const registrarCompra = { execute: jest.fn() };

    const ventas = new VentasController(
      registrarVenta as never,
      { execute: jest.fn() } as never,
      anularVenta as never,
      revertirVenta as never,
      reservations as never,
    );
    const inventario = new InventarioController(
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      registrarMovimiento as never,
      { execute: jest.fn() } as never,
    );
    const compras = new ComprasController(
      registrarCompra as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
    );

    await ventas.registrar({} as never, user);
    await ventas.anular('7', 'devolución', user);
    await ventas.revertirAnulacion('7', user);
    await ventas.cancelarReserva('reservation-7', user);
    await inventario.registrarMovimiento({} as never, user);
    await compras.registrar({} as never, user);

    expect(registrarVenta.execute).toHaveBeenCalledWith(
      expect.anything(),
      '42',
    );
    expect(anularVenta.execute).toHaveBeenCalledWith('7', '42', 'devolución');
    expect(revertirVenta.execute).toHaveBeenCalledWith('7', '42');
    expect(reservations.cancel).toHaveBeenCalledWith('reservation-7', '42');
    expect(registrarMovimiento.execute).toHaveBeenCalledWith(
      expect.anything(),
      42n,
    );
    expect(registrarCompra.execute).toHaveBeenCalledWith(
      expect.anything(),
      '42',
    );
  });

  it('rejects sale, inventory and purchase commands when the authenticated actor is absent', async () => {
    const ventas = new VentasController(
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { cancel: jest.fn() } as never,
    );
    const inventario = new InventarioController(
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
    );
    const compras = new ComprasController(
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
    );

    await expect(ventas.registrar({} as never, undefined)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(
      ventas.anular('7', 'devolución', undefined),
    ).rejects.toThrow(UnauthorizedException);
    await expect(ventas.revertirAnulacion('7', undefined)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(
      ventas.cancelarReserva('reservation-7', undefined),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      inventario.registrarMovimiento({} as never, undefined),
    ).rejects.toThrow(UnauthorizedException);
    await expect(compras.registrar({} as never, undefined)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
