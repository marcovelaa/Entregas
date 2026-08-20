import { CrearDescuentoUseCase } from './crear-descuento.use-case';
import { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';

describe('CrearDescuentoUseCase', () => {
  let repo: jest.Mocked<Pick<IDescuentoRepository, 'crear'>>;
  let useCase: CrearDescuentoUseCase;

  const validDto = {
    nombre: 'Descuento programado',
    tipo: 'PORCENTAJE' as const,
    valor: 10,
    alcance: 'GLOBAL' as const,
    canal: 'TODOS' as const,
    fechaInicio: '2026-08-01T00:00:00.000Z',
    fechaFin: '2026-08-31T00:00:00.000Z',
  };

  beforeEach(() => {
    repo = { crear: jest.fn().mockResolvedValue({ id: '999' } as any) };
    useCase = new CrearDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );
  });

  it('coerces malformed or out-of-range HH:MM to null, never throws (REQ-DIA-07)', async () => {
    const result = await useCase.execute({
      ...validDto,
      horaInicio: '9am',
      horaFin: '25:00',
    });

    expect(result.success).toBe(true);
    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ hora_inicio: null, hora_fin: null }),
    );

    await useCase.execute({ ...validDto, horaInicio: '12:60' });

    expect(repo.crear).toHaveBeenLastCalledWith(
      expect.objectContaining({ hora_inicio: null }),
    );
  });

  it('persists valid day/time values with array order preserved (REQ-DIA-08 S8.1)', async () => {
    await useCase.execute({
      ...validDto,
      diasSemana: [1, 2, 3],
      horaInicio: '14:00',
      horaFin: '18:00',
    });

    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        dias_semana: [1, 2, 3],
        hora_inicio: '14:00',
        hora_fin: '18:00',
      }),
    );
  });

  it('applies [] / null defaults on payloads without scheduling fields (REQ-DIA-08 S8.3)', async () => {
    await useCase.execute(validDto);

    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({
        dias_semana: [],
        hora_inicio: null,
        hora_fin: null,
      }),
    );
  });

  it('uppercases and trims codigoCupon', async () => {
    await useCase.execute({ ...validDto, codigoCupon: '  off10  ' });

    expect(repo.crear).toHaveBeenCalledWith(
      expect.objectContaining({ codigo_cupon: 'OFF10' }),
    );
  });

  it('returns the created id in the stable response shape', async () => {
    const result = await useCase.execute(validDto);
    expect(result).toEqual({
      success: true,
      message: 'Descuento creado exitosamente',
      data: { id: '999' },
    });
  });
});
