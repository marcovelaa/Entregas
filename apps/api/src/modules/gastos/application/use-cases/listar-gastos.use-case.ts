import { Injectable, Inject } from '@nestjs/common';
import { type IGastosRepository, GASTOS_REPOSITORY } from '../../domain/repositories/gastos.repository.interface';

@Injectable()
export class ListarGastosUseCase {
  constructor(
    @Inject(GASTOS_REPOSITORY)
    private readonly repo: IGastosRepository,
  ) {}

  async execute(params: { offset: number; limit: number; categoria?: string }) {
    return this.repo.listar(params);
  }
}
