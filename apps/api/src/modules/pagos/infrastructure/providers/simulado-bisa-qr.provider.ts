import { Injectable } from '@nestjs/common';
import {
  IBisaQrProvider,
  GenerarQrInput,
  GenerarQrOutput,
} from '../../domain/ports/bisa-qr-provider.interface';

@Injectable()
export class SimuladoBisaQrProvider implements IBisaQrProvider {
  async generarQR(input: GenerarQrInput): Promise<GenerarQrOutput> {
    const referenciaBisa = `BISA-SIM-${input.pedidoId}-${Date.now()}`;
    const qrContenido = `https://simulador-bisa.test/qr/${referenciaBisa}?monto=${input.monto}&moneda=${input.moneda}`;

    return {
      qrContenido,
      referenciaBisa,
      expiraEn: input.expiraEn,
    };
  }

  validarFirmaWebhook(payload: any, headers: any): boolean {
    if (headers && headers['x-bisa-signature'] === 'INVALID') {
      return false;
    }
    return true;
  }
}
