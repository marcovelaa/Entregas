import { Injectable, Inject } from '@nestjs/common';
import { VENTA_REPOSITORY } from '../../domain/repositories/venta.repository.interface';
import type { IVentaRepository } from '../../domain/repositories/venta.repository.interface';

@Injectable()
export class RevertirAnulacionVentaUseCase {
  constructor(
    @Inject(VENTA_REPOSITORY) private readonly ventaRepo: IVentaRepository
  ) {}

  async execute(venta_id: string, usuario_id: string) {
    return { data: await this.ventaRepo.revertirAnulacion(venta_id, usuario_id) };
  }
}
