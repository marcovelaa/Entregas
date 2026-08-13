import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ClienteAuthService } from './cliente-auth.service';
import type { IClienteRepository, ClienteConCredenciales } from '../domain/repositories/cliente.repository.interface';
import type { IClienteResetTokenRepository } from '../domain/repositories/cliente-reset-token.repository.interface';

process.env.CUSTOMER_JWT_SECRET = 'test-customer-secret';
process.env.CUSTOMER_JWT_REFRESH_SECRET = 'test-customer-refresh-secret';

function buildCliente(overrides: Partial<ClienteConCredenciales> = {}): ClienteConCredenciales {
  return {
    id: '1',
    nombres: 'Ana',
    apellidos: 'Pérez',
    email: 'ana@example.test',
    telefono: null,
    passwordHash: overrides.passwordHash ?? 'hashed-password',
    activo: overrides.activo ?? true,
    ...overrides,
  };
}

function createHarness() {
  const clienteRepo: jest.Mocked<IClienteRepository> = {
    crear: jest.fn(),
    actualizar: jest.fn(),
    listar: jest.fn(),
    obtenerPorId: jest.fn(),
    buscarPorEmailConCredenciales: jest.fn(),
    crearConCredenciales: jest.fn(),
    actualizarPassword: jest.fn(),
    obtenerConCredencialesPorId: jest.fn(),
  } as any;
  const resetTokenRepo: jest.Mocked<IClienteResetTokenRepository> = {
    crear: jest.fn(),
    buscarPorHash: jest.fn(),
    marcarUsado: jest.fn(),
  };
  const jwtService = { sign: jest.fn().mockReturnValue('signed-token'), verify: jest.fn() };
  const service = new ClienteAuthService(clienteRepo, resetTokenRepo, jwtService as any);
  return { service, clienteRepo, resetTokenRepo, jwtService };
}

describe('ClienteAuthService.registrar', () => {
  it('rechaza con ConflictException si el email ya tiene cuenta', async () => {
    const { service, clienteRepo } = createHarness();
    clienteRepo.buscarPorEmailConCredenciales.mockResolvedValue(buildCliente());

    await expect(
      service.registrar({ nombres: 'Ana', apellidos: 'Pérez', email: 'ana@example.test', password: 'password123' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('crea el cliente con password hasheado y devuelve tokens', async () => {
    const { service, clienteRepo } = createHarness();
    clienteRepo.buscarPorEmailConCredenciales.mockResolvedValue(null);
    clienteRepo.crearConCredenciales.mockResolvedValue(buildCliente());

    const result = await service.registrar({
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: 'ana@example.test',
      password: 'password123',
    } as any);

    const createArg = clienteRepo.crearConCredenciales.mock.calls[0][0];
    expect(await bcrypt.compare('password123', createArg.passwordHash)).toBe(true);
    expect(result.access_token).toBe('signed-token');
    expect(result.refresh_token).toBe('signed-token');
  });
});

describe('ClienteAuthService.validarCredenciales', () => {
  it('rechaza con UnauthorizedException si el email no existe', async () => {
    const { service, clienteRepo } = createHarness();
    clienteRepo.buscarPorEmailConCredenciales.mockResolvedValue(null);

    await expect(service.validarCredenciales('nadie@example.test', 'x')).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza con UnauthorizedException si la contraseña no coincide', async () => {
    const { service, clienteRepo } = createHarness();
    const hash = await bcrypt.hash('correcta', 12);
    clienteRepo.buscarPorEmailConCredenciales.mockResolvedValue(buildCliente({ passwordHash: hash }));

    await expect(service.validarCredenciales('ana@example.test', 'incorrecta')).rejects.toThrow(UnauthorizedException);
  });

  it('acepta credenciales correctas', async () => {
    const { service, clienteRepo } = createHarness();
    const hash = await bcrypt.hash('correcta', 12);
    clienteRepo.buscarPorEmailConCredenciales.mockResolvedValue(buildCliente({ passwordHash: hash }));

    const cliente = await service.validarCredenciales('ana@example.test', 'correcta');

    expect(cliente.email).toBe('ana@example.test');
  });
});

describe('ClienteAuthService.solicitarRecuperacion', () => {
  it('no revela si el email existe: siempre resuelve sin lanzar', async () => {
    const { service, clienteRepo } = createHarness();
    clienteRepo.buscarPorEmailConCredenciales.mockResolvedValue(null);

    await expect(service.solicitarRecuperacion('nadie@example.test')).resolves.toEqual({});
  });

  it('genera un token y lo devuelve en NODE_ENV distinto de production', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    const { service, clienteRepo, resetTokenRepo } = createHarness();
    clienteRepo.buscarPorEmailConCredenciales.mockResolvedValue(buildCliente());

    const result = await service.solicitarRecuperacion('ana@example.test');

    expect(resetTokenRepo.crear).toHaveBeenCalled();
    expect(result.devToken).toBeDefined();
    process.env.NODE_ENV = previous;
  });
});

describe('ClienteAuthService.restablecerPassword', () => {
  it('rechaza con BadRequestException si el token no existe', async () => {
    const { service, resetTokenRepo } = createHarness();
    resetTokenRepo.buscarPorHash.mockResolvedValue(null);

    await expect(service.restablecerPassword('token-invalido', 'nuevaPassword123')).rejects.toThrow(BadRequestException);
  });

  it('rechaza con BadRequestException si el token ya fue usado', async () => {
    const { service, resetTokenRepo } = createHarness();
    resetTokenRepo.buscarPorHash.mockResolvedValue({
      id: '1',
      clienteId: '1',
      tokenHash: 'x',
      expiraEn: new Date(Date.now() + 60_000),
      usado: true,
    });

    await expect(service.restablecerPassword('token', 'nuevaPassword123')).rejects.toThrow(BadRequestException);
  });

  it('rechaza con BadRequestException si el token expiró', async () => {
    const { service, resetTokenRepo } = createHarness();
    resetTokenRepo.buscarPorHash.mockResolvedValue({
      id: '1',
      clienteId: '1',
      tokenHash: 'x',
      expiraEn: new Date(Date.now() - 60_000),
      usado: false,
    });

    await expect(service.restablecerPassword('token', 'nuevaPassword123')).rejects.toThrow(BadRequestException);
  });

  it('actualiza el password y marca el token como usado cuando es válido', async () => {
    const { service, resetTokenRepo, clienteRepo } = createHarness();
    resetTokenRepo.buscarPorHash.mockResolvedValue({
      id: '1',
      clienteId: '1',
      tokenHash: 'x',
      expiraEn: new Date(Date.now() + 60_000),
      usado: false,
    });

    await service.restablecerPassword('token', 'nuevaPassword123');

    expect(clienteRepo.actualizarPassword).toHaveBeenCalledWith('1', expect.any(String));
    expect(resetTokenRepo.marcarUsado).toHaveBeenCalledWith('1');
  });
});

describe('ClienteAuthService.cambiarPassword', () => {
  it('rechaza con UnauthorizedException si la contraseña actual es incorrecta', async () => {
    const { service, clienteRepo } = createHarness();
    const hash = await bcrypt.hash('actual-correcta', 12);
    clienteRepo.obtenerConCredencialesPorId.mockResolvedValue(buildCliente({ passwordHash: hash }));

    await expect(service.cambiarPassword('1', 'actual-incorrecta', 'nuevaPassword123')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('actualiza el password cuando la contraseña actual es correcta', async () => {
    const { service, clienteRepo } = createHarness();
    const hash = await bcrypt.hash('actual-correcta', 12);
    clienteRepo.obtenerConCredencialesPorId.mockResolvedValue(buildCliente({ passwordHash: hash }));

    await service.cambiarPassword('1', 'actual-correcta', 'nuevaPassword123');

    expect(clienteRepo.actualizarPassword).toHaveBeenCalledWith('1', expect.any(String));
  });
});
