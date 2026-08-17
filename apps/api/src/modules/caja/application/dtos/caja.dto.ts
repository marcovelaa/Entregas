import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AbrirCajaDto {
  @IsNumber()
  monto_apertura: number;
}

export class CerrarCajaDto {
  @IsNumber()
  monto_cierre_real: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class RegistrarMovimientoDto {
  @IsString()
  tipo_movimiento: 'INGRESO' | 'EGRESO';

  @IsString()
  concepto: string;

  @IsNumber()
  monto: number;

  @IsString()
  @IsOptional()
  metodo_pago?: string;
}
