import { Inject, Injectable } from '@nestjs/common';
import { INVENTARIO_REPOSITORY, type IInventarioRepository } from '../../domain/repositories/inventario.repository.interface';

@Injectable()
export class ListarAlertasUseCase {
  constructor(
    @Inject(INVENTARIO_REPOSITORY)
    private readonly inventarioRepo: IInventarioRepository,
  ) {}

  async execute() {
    return this.inventarioRepo.listarAlertas();
  }
}
