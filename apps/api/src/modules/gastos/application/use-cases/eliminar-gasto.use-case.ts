import { Injectable, Inject } from '@nestjs/common';
import { type IGastosRepository, GASTOS_REPOSITORY } from '../../domain/repositories/gastos.repository.interface';

@Injectable()
export class EliminarGastoUseCase {
  constructor(
    @Inject(GASTOS_REPOSITORY)
    private readonly repo: IGastosRepository,
  ) {}

  async execute(id: string) {
    return this.repo.eliminar(id);
  }
}
