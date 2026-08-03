import { IsString, IsNotEmpty, IsInt, IsOptional, Min, IsEnum } from 'class-validator';

export enum TipoMovimiento {
  INGRESO_MANUAL = 'INGRESO_MANUAL',
  SALIDA_MANUAL = 'SALIDA_MANUAL',
  INGRESO_COMPRA = 'INGRESO_COMPRA',
  SALIDA_VENTA = 'SALIDA_VENTA'
}

export class RegistrarMovimientoDto {
  @IsNotEmpty()
  producto_id: string;

  @IsOptional()
  variante_id?: string;

  @IsEnum(TipoMovimiento)
  tipo_movimiento: TipoMovimiento;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsString()
  @IsOptional()
  motivo?: string;
}
