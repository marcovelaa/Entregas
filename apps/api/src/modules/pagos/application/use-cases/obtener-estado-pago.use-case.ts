import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  PAGO_QR_REPOSITORY,
  type IPagoQrRepository,
  type PagoQrData,
} from '../../domain/repositories/pago-qr.repository.interface';

@Injectable()
export class ObtenerEstadoPagoUseCase {
  constructor(
    @Inject(PAGO_QR_REPOSITORY)
    private readonly pagoRepo: IPagoQrRepository,
  ) {}

  async execute(id: string): Promise<PagoQrData> {
    const pago = await this.pagoRepo.obtenerPorId(id);
    if (!pago) {
      throw new NotFoundException('El pago QR no existe');
    }
    return pago;
  }
}
