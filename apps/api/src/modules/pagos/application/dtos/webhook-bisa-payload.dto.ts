import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class WebhookBisaPayloadDto {
  @IsString()
  @IsNotEmpty()
  referencia_bisa: string;

  @IsString()
  @IsNotEmpty()
  estado: string;

  @IsNumber()
  monto: number;

  @IsOptional()
  @IsString()
  event_id?: string;

  @IsOptional()
  @IsString()
  fecha_transaccion?: string;
}
