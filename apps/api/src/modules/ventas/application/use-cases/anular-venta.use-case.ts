import { IVentaRepository } from '../../domain/repositories/venta.repository.interface';

export class AnularVentaUseCase {
  constructor(private readonly ventaRepo: IVentaRepository) {}

  async execute(venta_id: string, usuario_id: string, motivo: string) {
    return { data: await this.ventaRepo.anular(venta_id, usuario_id, motivo) };
  }
}
