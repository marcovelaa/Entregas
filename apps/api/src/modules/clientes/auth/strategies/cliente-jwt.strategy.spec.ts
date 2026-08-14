import { UnauthorizedException } from '@nestjs/common';
import { ClienteJwtStrategy } from './cliente-jwt.strategy';
import type { IClienteRepository } from '../../domain/repositories/cliente.repository.interface';

process.env.CUSTOMER_JWT_SECRET = 'test-customer-secret';

function buildRepoMock(): jest.Mocked<IClienteRepository> {
  return {
    crear: jest.fn(),
    actualizar: jest.fn(),
    listar: jest.fn(),
    obtenerPorId: jest.fn(),
    buscarPorEmailConCredenciales: jest.fn(),
    crearConCredenciales: jest.fn(),
    actualizarPassword: jest.fn(),
    obtenerConCredencialesPorId: jest.fn(),
  };
}

describe('ClienteJwtStrategy.validate', () => {
  it('rechaza si el cliente no existe', async () => {
    const repo = buildRepoMock();
    repo.obtenerConCredencialesPorId.mockResolvedValue(null);
    const strategy = new ClienteJwtStrategy(repo);

    await expect(
      strategy.validate({ sub: '1', email: 'ana@example.test' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza si el cliente está inactivo', async () => {
    const repo = buildRepoMock();
    repo.obtenerConCredencialesPorId.mockResolvedValue({
      id: '1',
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.test',
      telefono: null,
      passwordHash: 'hash',
      activo: false,
    });
    const strategy = new ClienteJwtStrategy(repo);

    await expect(
      strategy.validate({ sub: '1', email: 'ana@example.test' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('devuelve el cliente autenticado si es válido', async () => {
    const repo = buildRepoMock();
    repo.obtenerConCredencialesPorId.mockResolvedValue({
      id: '1',
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.test',
      telefono: null,
      passwordHash: 'hash',
      activo: true,
    });
    const strategy = new ClienteJwtStrategy(repo);

    const result = await strategy.validate({
      sub: '1',
      email: 'ana@example.test',
    });

    expect(result).toEqual({
      id: '1',
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.test',
    });
  });
});
