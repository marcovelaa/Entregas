import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { PAGO_QR_REPOSITORY } from './domain/repositories/pago-qr.repository.interface';
import { PrismaPagoQrRepository } from './infrastructure/repositories/prisma-pago-qr.repository';
import { BISA_QR_PROVIDER } from './domain/ports/bisa-qr-provider.interface';
import { SimuladoBisaQrProvider } from './infrastructure/providers/simulado-bisa-qr.provider';
import { GenerarPagoQrUseCase } from './application/use-cases/generar-pago-qr.use-case';
import { ProcesarWebhookBisaUseCase } from './application/use-cases/procesar-webhook-bisa.use-case';
import { ObtenerEstadoPagoUseCase } from './application/use-cases/obtener-estado-pago.use-case';
import { PagosBisaController } from './infrastructure/controllers/pagos-bisa.controller';

@Module({
  imports: [PrismaModule, PedidosModule],
  controllers: [PagosBisaController],
  providers: [
    {
      provide: PAGO_QR_REPOSITORY,
      useClass: PrismaPagoQrRepository,
    },
    {
      provide: BISA_QR_PROVIDER,
      useClass: SimuladoBisaQrProvider,
    },
    GenerarPagoQrUseCase,
    ProcesarWebhookBisaUseCase,
    ObtenerEstadoPagoUseCase,
  ],
  exports: [
    PAGO_QR_REPOSITORY,
    BISA_QR_PROVIDER,
    GenerarPagoQrUseCase,
    ProcesarWebhookBisaUseCase,
    ObtenerEstadoPagoUseCase,
  ],
})
export class PagosModule {}
