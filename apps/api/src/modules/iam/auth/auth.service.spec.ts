import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Usuario } from '../domain/entities/usuario.entity';
import type { IUsuarioRepository } from '../domain/repositories/usuario.repository.interface';
import type { IRolRepository } from '../domain/repositories/rol.repository.interface';
import { Rol } from '../domain/entities/rol.entity';

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

function buildUsuario(
  overrides: Partial<{ activo: boolean; passwordHash: string }> = {},
) {
  return new Usuario(
    1n,
    'public-id-1',
    10n,
    'Ana',
    'Vendedora',
    'ana@entregas.bo',
    null,
    overrides.passwordHash ?? 'hashed-password',
    null,
    overrides.activo ?? true,
    null,
    new Date(),
    new Date(),
  );
}

function createHarness() {
  const usuarioRepo: jest.Mocked<IUsuarioRepository> = {
    findById: jest.fn(),
    findByPublicId: jest.fn(),
    findByEmail: jest.fn(),
    findByCodigoReferido: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const rolRepo: jest.Mocked<IRolRepository> = {
    findById: jest.fn(),
    findByNombre: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getPermisosPorRol: jest.fn(),
    asignarPermisos: jest.fn(),
  };
  const jwtService = { sign: jest.fn(), verify: jest.fn() };

  const service = new AuthService(usuarioRepo, rolRepo, jwtService as any);
  return { service, usuarioRepo, rolRepo, jwtService };
}

describe('AuthService.validarCredenciales', () => {
  it('rechaza con UnauthorizedException si el email no existe', async () => {
    const { service, usuarioRepo } = createHarness();
    usuarioRepo.findByEmail.mockResolvedValue(null);

    await expect(
      service.validarCredenciales('nadie@entregas.bo', 'x'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza con UnauthorizedException si el usuario está inactivo', async () => {
    const { service, usuarioRepo } = createHarness();
    usuarioRepo.findByEmail.mockResolvedValue(buildUsuario({ activo: false }));

    await expect(
      service.validarCredenciales('ana@entregas.bo', 'x'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza con UnauthorizedException si el password no coincide', async () => {
    const { service, usuarioRepo } = createHarness();
    const hash = await bcrypt.hash('password_correcto', 10);
    usuarioRepo.findByEmail.mockResolvedValue(
      buildUsuario({ passwordHash: hash }),
    );

    await expect(
      service.validarCredenciales('ana@entregas.bo', 'password_incorrecto'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('devuelve el usuario cuando el email existe, está activo y el password coincide', async () => {
    const { service, usuarioRepo } = createHarness();
    const hash = await bcrypt.hash('password_correcto', 10);
    const usuario = buildUsuario({ passwordHash: hash });
    usuarioRepo.findByEmail.mockResolvedValue(usuario);

    const result = await service.validarCredenciales(
      'ana@entregas.bo',
      'password_correcto',
    );

    expect(result).toBe(usuario);
  });
});

describe('AuthService.login', () => {
  it('firma un access_token y un refresh_token, embebiendo permisos y rol del usuario', async () => {
    const { service, rolRepo, usuarioRepo, jwtService } = createHarness();
    const usuario = buildUsuario();
    rolRepo.findById.mockResolvedValue(
      new Rol(10n, 'Vendedor', null, true, new Date(), new Date()),
    );
    rolRepo.getPermisosPorRol.mockResolvedValue(['ventas:crear', 'ventas:ver']);
    usuarioRepo.update.mockResolvedValue(usuario);
    jwtService.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');

    const result = await service.login(usuario);

    expect(result.access_token).toBe('access-token');
    expect(result.refresh_token).toBe('refresh-token');
    expect(result.usuario).toEqual(
      expect.objectContaining({
        id: '1',
        email: 'ana@entregas.bo',
        rol: 'Vendedor',
      }),
    );

    const [payload, options] = jwtService.sign.mock.calls[0];
    expect(payload).toEqual(
      expect.objectContaining({
        sub: '1',
        rolNombre: 'Vendedor',
        permisos: ['ventas:crear', 'ventas:ver'],
      }),
    );
    expect(options).toEqual(
      expect.objectContaining({ secret: 'test-secret', expiresIn: '8h' }),
    );

    // Registers last access on the persisted user
    expect(usuarioRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({ ultimoAccesoEn: expect.any(Date) }),
    );
  });
});

describe('AuthService.refrescar', () => {
  it('rechaza con UnauthorizedException si el refresh token no verifica', async () => {
    const { service, jwtService } = createHarness();
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(service.refrescar('token-invalido')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza con UnauthorizedException si el usuario del token ya no existe o está inactivo', async () => {
    const { service, jwtService, usuarioRepo } = createHarness();
    jwtService.verify.mockReturnValue({ sub: '1' });
    usuarioRepo.findById.mockResolvedValue(null);

    await expect(service.refrescar('token-valido')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('emite un nuevo par de tokens cuando el refresh token es válido y el usuario sigue activo', async () => {
    const { service, jwtService, usuarioRepo, rolRepo } = createHarness();
    const usuario = buildUsuario();
    jwtService.verify.mockReturnValue({ sub: '1' });
    usuarioRepo.findById.mockResolvedValue(usuario);
    usuarioRepo.update.mockResolvedValue(usuario);
    rolRepo.findById.mockResolvedValue(
      new Rol(10n, 'Vendedor', null, true, new Date(), new Date()),
    );
    rolRepo.getPermisosPorRol.mockResolvedValue([]);
    jwtService.sign
      .mockReturnValueOnce('new-access-token')
      .mockReturnValueOnce('new-refresh-token');

    const result = await service.refrescar('token-valido');

    expect(result.access_token).toBe('new-access-token');
    expect(result.refresh_token).toBe('new-refresh-token');
  });
});
