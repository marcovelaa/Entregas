import { Test, TestingModule } from '@nestjs/testing';
import { BitacoraService } from './bitacora.service';
import {
  BITACORA_REPOSITORY,
  IBitacoraRepository,
  BitacoraData,
} from '../../domain/repositories/bitacora.repository.interface';
import { TipoActorBitacora, EntidadBitacora } from '../../domain/entities/bitacora-enums';

describe('BitacoraService', () => {
  let bitacoraService: BitacoraService;
  let mockBitacoraRepo: jest.Mocked<IBitacoraRepository>;

  const mockRegistro: BitacoraData = {
    id: '1',
    public_id: 'uuid-1',
    tipo_actor: TipoActorBitacora.USUARIO,
    usuario_id: '10',
    entidad: EntidadBitacora.SEGURIDAD,
    operacion: 'LOGIN_EXITOSO',
    datos_nuevos: { email: 'admin@test.com' },
    creado_en: new Date(),
  };

  beforeEach(async () => {
    mockBitacoraRepo = {
      registrar: jest.fn(),
      listarErp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BitacoraService,
        { provide: BITACORA_REPOSITORY, useValue: mockBitacoraRepo },
      ],
    }).compile();

    bitacoraService = module.get<BitacoraService>(BitacoraService);
  });

  describe('sanitizar', () => {
    it('redacta campos sensibles como password, token, secret y password_hash', () => {
      const input = {
        email: 'user@test.com',
        password: 'SecretPassword123!',
        nested: {
          token: 'eyJhbGciOi...',
          normal: 'value',
        },
      };

      const result = bitacoraService.sanitizar(input);

      expect(result.password).toBe('[REDACTED]');
      expect(result.nested.token).toBe('[REDACTED]');
      expect(result.email).toBe('user@test.com');
      expect(result.nested.normal).toBe('value');
    });
  });

  describe('registrar', () => {
    it('registra evento en la bitácora sanitizando datos automáticamente', async () => {
      mockBitacoraRepo.registrar.mockResolvedValue(mockRegistro);

      const res = await bitacoraService.registrar({
        tipo_actor: TipoActorBitacora.USUARIO,
        usuario_id: '10',
        entidad: EntidadBitacora.SEGURIDAD,
        operacion: 'LOGIN_EXITOSO',
        datos_nuevos: { password: 'SecretPassword123!', email: 'admin@test.com' },
      });

      expect(res?.id).toBe('1');
      expect(mockBitacoraRepo.registrar).toHaveBeenCalledWith(
        expect.objectContaining({
          datos_nuevos: expect.objectContaining({
            password: '[REDACTED]',
            email: 'admin@test.com',
          }),
        }),
      );
    });
  });
});
