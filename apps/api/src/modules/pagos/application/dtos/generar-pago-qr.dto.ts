import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerarPagoQrDto {
  @IsString()
  @IsNotEmpty()
  pedido_id: string;

  @IsOptional()
  @IsString()
  idempotency_key?: string;
}
