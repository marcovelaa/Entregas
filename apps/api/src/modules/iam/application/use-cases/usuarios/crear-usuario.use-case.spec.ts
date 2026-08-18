import { CrearUsuarioUseCase } from './crear-usuario.use-case';
import { Usuario } from '../../../domain/entities/usuario.entity';
import { Rol } from '../../../domain/entities/rol.entity';
import type { IUsuarioRepository } from '../../../domain/repositories/usuario.repository.interface';
import type { IRolRepository } from '../../../domain/repositories/rol.repository.interface';
import { CrearUsuarioDto } from '../../dtos/crear-usuario.dto';
import {
  CodigoReferidoDuplicadoException,
  RolNoEncontradoException,
  UsuarioDuplicadoException,
} from '../../../domain/exceptions/iam.exceptions';

function buildDto(overrides: Partial<CrearUsuarioDto> = {}): CrearUsuarioDto {
  const dto = new CrearUsuarioDto();
  dto.rolId = overrides.rolId ?? '10';
  dto.nombres = overrides.nombres ?? 'Ana';
  dto.apellidos = overrides.apellidos ?? 'Vendedora';
  dto.email = overrides.email ?? 'ana@entregas.bo';
  dto.password = overrides.password ?? 'password123';
  dto.telefono = overrides.telefono;
  dto.codigoReferido = overrides.codigoReferido;
  return dto;
}

function buildRol(): Rol {
  return new Rol(10n, 'Vendedor', null, true, new Date(), new Date());
}

function buildUsuarioExistente(
  overrides: Partial<{ email: string; codigoReferido: string | null }> = {},
): Usuario {
  return new Usuario(
    2n,
    'public-id-2',
    10n,
    'Otro',
    'Usuario',
    overrides.email ?? 'otro@entregas.bo',
    null,
    'hashed-password',
    overrides.codigoReferido ?? null,
    true,
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

  const useCase = new CrearUsuarioUseCase(usuarioRepo, rolRepo);
  return { useCase, usuarioRepo, rolRepo };
}

describe('CrearUsuarioUseCase.execute', () => {
  it('rechaza con RolNoEncontradoException cuando el rol no existe', async () => {
    const { useCase, rolRepo, usuarioRepo } = createHarness();
    rolRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(buildDto())).rejects.toThrow(
      RolNoEncontradoException,
    );
    expect(usuarioRepo.save).not.toHaveBeenCalled();
  });

  it('crea el usuario con codigoReferido null cuando no se envía código, sin consultar duplicados de código', async () => {
    const { useCase, rolRepo, usuarioRepo } = createHarness();
    rolRepo.findById.mockResolvedValue(buildRol());
    usuarioRepo.findByEmail.mockResolvedValue(null);
    usuarioRepo.save.mockImplementation(async (u) => u);

    await useCase.execute(buildDto({ codigoReferido: undefined }));

    expect(usuarioRepo.findByCodigoReferido).not.toHaveBeenCalled();
    expect(usuarioRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ codigoReferido: null }),
    );
  });

  it('consulta findByCodigoReferido con el string exacto y persiste ese mismo valor cuando se envía código', async () => {
    const { useCase, rolRepo, usuarioRepo } = createHarness();
    rolRepo.findById.mockResolvedValue(buildRol());
    usuarioRepo.findByEmail.mockResolvedValue(null);
    usuarioRepo.findByCodigoReferido.mockResolvedValue(null);
    usuarioRepo.save.mockImplementation(async (u) => u);

    await useCase.execute(buildDto({ codigoReferido: 'REF123' }));

    expect(usuarioRepo.findByCodigoReferido).toHaveBeenCalledWith('REF123');
    expect(usuarioRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ codigoReferido: 'REF123' }),
    );
  });

  it('rechaza con UsuarioDuplicadoException cuando el email ya existe, sin guardar', async () => {
    const { useCase, rolRepo, usuarioRepo } = createHarness();
    rolRepo.findById.mockResolvedValue(buildRol());
    usuarioRepo.findByEmail.mockResolvedValue(
      buildUsuarioExistente({ email: 'ana@entregas.bo' }),
    );

    await expect(
      useCase.execute(buildDto({ email: 'ana@entregas.bo' })),
    ).rejects.toThrow(UsuarioDuplicadoException);
    expect(usuarioRepo.save).not.toHaveBeenCalled();
  });

  it('rechaza con CodigoReferidoDuplicadoException cuando el código ya existe, sin guardar', async () => {
    const { useCase, rolRepo, usuarioRepo } = createHarness();
    rolRepo.findById.mockResolvedValue(buildRol());
    usuarioRepo.findByEmail.mockResolvedValue(null);
    usuarioRepo.findByCodigoReferido.mockResolvedValue(
      buildUsuarioExistente({ codigoReferido: 'REF123' }),
    );

    await expect(
      useCase.execute(buildDto({ codigoReferido: 'REF123' })),
    ).rejects.toThrow(CodigoReferidoDuplicadoException);
    expect(usuarioRepo.save).not.toHaveBeenCalled();
  });

  it('cuando email y código están duplicados, gana UsuarioDuplicadoException sin consultar findByCodigoReferido', async () => {
    const { useCase, rolRepo, usuarioRepo } = createHarness();
    rolRepo.findById.mockResolvedValue(buildRol());
    usuarioRepo.findByEmail.mockResolvedValue(
      buildUsuarioExistente({ email: 'ana@entregas.bo' }),
    );

    await expect(
      useCase.execute(
        buildDto({ email: 'ana@entregas.bo', codigoReferido: 'REF123' }),
      ),
    ).rejects.toThrow(UsuarioDuplicadoException);
    expect(usuarioRepo.findByCodigoReferido).not.toHaveBeenCalled();
    expect(usuarioRepo.save).not.toHaveBeenCalled();
  });

  it('no normaliza mayúsculas/minúsculas: "ABC" no colisiona con "abc" existente', async () => {
    const { useCase, rolRepo, usuarioRepo } = createHarness();
    rolRepo.findById.mockResolvedValue(buildRol());
    usuarioRepo.findByEmail.mockResolvedValue(null);
    usuarioRepo.findByCodigoReferido.mockImplementation(async (codigo) =>
      codigo === 'abc' ? buildUsuarioExistente({ codigoReferido: 'abc' }) : null,
    );
    usuarioRepo.save.mockImplementation(async (u) => u);

    const usuario = await useCase.execute(buildDto({ codigoReferido: 'ABC' }));

    expect(usuarioRepo.findByCodigoReferido).toHaveBeenCalledWith('ABC');
    expect(usuario.codigoReferido).toBe('ABC');
    expect(usuarioRepo.save).toHaveBeenCalled();
  });
});
