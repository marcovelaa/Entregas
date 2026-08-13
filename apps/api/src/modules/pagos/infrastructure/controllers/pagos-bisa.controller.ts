import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from '../../../iam/auth/decorators/public.decorator';
import { GenerarPagoQrUseCase } from '../../application/use-cases/generar-pago-qr.use-case';
import { ProcesarWebhookBisaUseCase } from '../../application/use-cases/procesar-webhook-bisa.use-case';
import { ObtenerEstadoPagoUseCase } from '../../application/use-cases/obtener-estado-pago.use-case';
import { GenerarPagoQrDto } from '../../application/dtos/generar-pago-qr.dto';
import { WebhookBisaPayloadDto } from '../../application/dtos/webhook-bisa-payload.dto';

@Controller('pagos')
export class PagosBisaController {
  constructor(
    private readonly generarPagoQrUseCase: GenerarPagoQrUseCase,
    private readonly procesarWebhookBisaUseCase: ProcesarWebhookBisaUseCase,
    private readonly obtenerEstadoPagoUseCase: ObtenerEstadoPagoUseCase,
  ) {}

  @Public()
  @Post('qr/generar')
  @HttpCode(HttpStatus.CREATED)
  async generar(@Body() dto: GenerarPagoQrDto) {
    return this.generarPagoQrUseCase.execute(dto);
  }

  @Public()
  @Post('bisa/webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Body() dto: WebhookBisaPayloadDto,
    @Headers() headers: any,
  ) {
    return this.procesarWebhookBisaUseCase.execute(dto, headers);
  }

  @Public()
  @Get('qr/:id/estado')
  async obtenerEstado(@Param('id') id: string) {
    return this.obtenerEstadoPagoUseCase.execute(id);
  }
}
