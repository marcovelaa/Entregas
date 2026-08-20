import { NotFoundException } from '@nestjs/common';
import { ActualizarDescuentoUseCase } from './actualizar-descuento.use-case';
import { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';

describe('ActualizarDescuentoUseCase', () => {
  let repo: jest.Mocked<Pick<IDescuentoRepository, 'actualizarCompleto'>>;
  let useCase: ActualizarDescuentoUseCase;

  beforeEach(() => {
    repo = { actualizarCompleto: jest.fn().mockResolvedValue(true) };
    useCase = new ActualizarDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );
  });

  it('throws NotFoundException (404) when the repository reports no match — matches PATCH contract', async () => {
    repo.actualizarCompleto.mockResolvedValue(false);

    await expect(useCase.execute('999', { nombre: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('only forwards relation ids and flags replacement when at least one relation array is present', async () => {
    await useCase.execute('5', {
      nombre: 'Nuevo nombre',
      productoIds: ['1'],
    });

    expect(repo.actualizarCompleto).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({ nombre: 'Nuevo nombre', productoIds: ['1'] }),
      true,
    );
  });

  it('does not flag relation replacement when no relation array is present', async () => {
    await useCase.execute('5', { nombre: 'Solo nombre' });

    expect(repo.actualizarCompleto).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({ nombre: 'Solo nombre' }),
      false,
    );
  });

  it('uppercases codigoCupon when provided', async () => {
    await useCase.execute('5', { codigoCupon: 'off10' });

    expect(repo.actualizarCompleto).toHaveBeenCalledWith(
      '5',
      expect.objectContaining({ codigo_cupon: 'OFF10' }),
      false,
    );
  });

  it('returns the stable success response shape', async () => {
    const result = await useCase.execute('5', { nombre: 'x' });
    expect(result).toEqual({
      success: true,
      message: 'Descuento actualizado exitosamente',
    });
  });
});
