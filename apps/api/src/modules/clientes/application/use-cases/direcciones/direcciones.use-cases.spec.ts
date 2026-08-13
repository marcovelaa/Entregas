import { NotFoundException } from '@nestjs/common';
import { ListarDireccionesUseCase } from './listar-direcciones.use-case';
import { CrearDireccionUseCase } from './crear-direccion.use-case';
import { ActualizarDireccionUseCase } from './actualizar-direccion.use-case';
import { EliminarDireccionUseCase } from './eliminar-direccion.use-case';
import { MarcarDireccionPrincipalUseCase } from './marcar-direccion-principal.use-case';
import type { IDireccionRepository } from '../../../domain/repositories/direccion.repository.interface';

function buildRepoMock(): jest.Mocked<IDireccionRepository> {
  return {
    listarPorCliente: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    marcarPrincipal: jest.fn(),
  };
}

describe('Direcciones use cases', () => {
  it('ListarDireccionesUseCase delega en el repositorio scoped al cliente', async () => {
    const repo = buildRepoMock();
    repo.listarPorCliente.mockResolvedValue([{ id: '1' } as any]);
    const useCase = new ListarDireccionesUseCase(repo);

    const result = await useCase.execute('cliente-1');

    expect(repo.listarPorCliente).toHaveBeenCalledWith('cliente-1');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('ActualizarDireccionUseCase lanza NotFoundException si el repositorio no encuentra la fila del cliente', async () => {
    const repo = buildRepoMock();
    repo.actualizar.mockResolvedValue(null);
    const useCase = new ActualizarDireccionUseCase(repo);

    await expect(useCase.execute('cliente-1', 'direccion-de-otro-cliente', { alias: 'Casa' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('EliminarDireccionUseCase lanza NotFoundException si el repositorio no borró nada', async () => {
    const repo = buildRepoMock();
    repo.eliminar.mockResolvedValue(false);
    const useCase = new EliminarDireccionUseCase(repo);

    await expect(useCase.execute('cliente-1', 'direccion-de-otro-cliente')).rejects.toThrow(NotFoundException);
  });

  it('MarcarDireccionPrincipalUseCase lanza NotFoundException si el repositorio no encuentra la fila del cliente', async () => {
    const repo = buildRepoMock();
    repo.marcarPrincipal.mockResolvedValue(false);
    const useCase = new MarcarDireccionPrincipalUseCase(repo);

    await expect(useCase.execute('cliente-1', 'direccion-de-otro-cliente')).rejects.toThrow(NotFoundException);
  });

  it('CrearDireccionUseCase delega en el repositorio con el clienteId', async () => {
    const repo = buildRepoMock();
    repo.crear.mockResolvedValue({ id: '9' } as any);
    const useCase = new CrearDireccionUseCase(repo);

    const result = await useCase.execute('cliente-1', { alias: 'Casa' } as any);

    expect(repo.crear).toHaveBeenCalledWith('cliente-1', { alias: 'Casa' });
    expect(result).toEqual({ id: '9' });
  });
});
