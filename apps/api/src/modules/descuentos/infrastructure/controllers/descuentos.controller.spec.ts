import { DescuentosController } from './descuentos.controller';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { DiscountEngineService } from '../../domain/discount-engine.service';

describe('DescuentosController - Scheduling Fields Parse & Round-trip', () => {
  let controller: DescuentosController;
  let mockPrisma: any;
  let mockEngine: any;

  const validPayload = {
    nombre: 'Descuento programado',
    tipo: 'PORCENTAJE',
    valor: 10,
    alcance: 'GLOBAL',
    canal: 'TODOS',
    fechaInicio: '2026-08-01T00:00:00.000Z',
    fechaFin: '2026-08-31T00:00:00.000Z',
  };

  beforeEach(() => {
    mockPrisma = {
      descuento: {
        create: jest.fn().mockResolvedValue({ id: BigInt(999) }),
        findUnique: jest.fn().mockResolvedValue({ id: BigInt(5), activo: true }),
        update: jest.fn().mockResolvedValue({ id: BigInt(5), activo: true }),
      },
    };
    mockEngine = { evaluate: jest.fn() };
    controller = new DescuentosController(mockPrisma as PrismaService, mockEngine as DiscountEngineService);
  });

  it('coerces malformed or out-of-range HH:MM to null on create, never a 400 (REQ-DIA-07)', async () => {
    const result = await controller.crear({
      ...validPayload,
      horaInicio: '9am',
      horaFin: '25:00',
    });

    expect(result.success).toBe(true);
    expect(mockPrisma.descuento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hora_inicio: null, hora_fin: null }),
      }),
    );

    await controller.crear({
      ...validPayload,
      horaInicio: '12:60',
    });

    expect(mockPrisma.descuento.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hora_inicio: null }),
      }),
    );
  });

  it('persists valid day/time values with array order preserved (REQ-DIA-08 S8.1)', async () => {
    await controller.crear({
      ...validPayload,
      diasSemana: [1, 2, 3],
      horaInicio: '14:00',
      horaFin: '18:00',
    });

    expect(mockPrisma.descuento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dias_semana: [1, 2, 3],
          hora_inicio: '14:00',
          hora_fin: '18:00',
        }),
      }),
    );
  });

  it('PATCH with only diasSemana keeps every other field intact (REQ-DIA-08 S8.2)', async () => {
    await controller.toggleOActualizarParcial('5', { diasSemana: [1] });

    expect(mockPrisma.descuento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { dias_semana: [1] },
      }),
    );
  });

  it('applies [] / null defaults on legacy payloads without the new fields (REQ-DIA-08 S8.3)', async () => {
    await controller.crear(validPayload);

    expect(mockPrisma.descuento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dias_semana: [],
          hora_inicio: null,
          hora_fin: null,
        }),
      }),
    );
  });
});
