import { NotFoundException } from '@nestjs/common';
import { ActualizarParcialDescuentoUseCase } from './actualizar-parcial-descuento.use-case';
import { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';

describe('ActualizarParcialDescuentoUseCase', () => {
  let repo: jest.Mocked<Pick<IDescuentoRepository, 'actualizarParcial'>>;
  let useCase: ActualizarParcialDescuentoUseCase;

  beforeEach(() => {
    repo = {
      actualizarParcial: jest
        .fn()
        .mockResolvedValue({ id: '5', activo: true } as any),
    };
    useCase = new ActualizarParcialDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );
  });

  it('sends only the fields that were actually provided (REQ-DIA-08 S8.2)', async () => {
    await useCase.execute('5', { diasSemana: [1] });

    expect(repo.actualizarParcial).toHaveBeenCalledWith('5', {
      dias_semana: [1],
    });
  });

  it('throws NotFoundException (404) when the repository reports no match — never a bare {success:false}', async () => {
    repo.actualizarParcial.mockResolvedValue(null);

    await expect(useCase.execute('999', { activo: true })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('coerces malformed HH:MM to null instead of failing', async () => {
    await useCase.execute('5', { horaInicio: '25:00' });

    expect(repo.actualizarParcial).toHaveBeenCalledWith('5', {
      hora_inicio: null,
    });
  });

  it('returns the stable success response shape', async () => {
    const result = await useCase.execute('5', { activo: true });
    expect(result).toEqual({
      success: true,
      message: 'Descuento actualizado exitosamente',
      data: { id: '5', activo: true },
    });
  });
});
