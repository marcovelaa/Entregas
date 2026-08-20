import { NotFoundException } from '@nestjs/common';
import { EliminarDescuentoUseCase } from './eliminar-descuento.use-case';
import { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';

describe('EliminarDescuentoUseCase', () => {
  let repo: jest.Mocked<Pick<IDescuentoRepository, 'buscarPorId' | 'eliminar'>>;
  let useCase: EliminarDescuentoUseCase;

  beforeEach(() => {
    repo = {
      buscarPorId: jest.fn().mockResolvedValue({ id: '5' } as any),
      eliminar: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new EliminarDescuentoUseCase(
      repo as unknown as IDescuentoRepository,
    );
  });

  it('throws NotFoundException (404) instead of letting a raw Prisma error leak', async () => {
    repo.buscarPorId.mockResolvedValue(null);

    await expect(useCase.execute('999')).rejects.toThrow(NotFoundException);
    expect(repo.eliminar).not.toHaveBeenCalled();
  });

  it('deletes and returns the stable success response shape', async () => {
    const result = await useCase.execute('5');
    expect(repo.eliminar).toHaveBeenCalledWith('5');
    expect(result).toEqual({ success: true, message: 'Descuento eliminado' });
  });
});
