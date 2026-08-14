import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  Min,
  IsEnum,
} from 'class-validator';

export enum TipoMovimiento {
  INGRESO_MANUAL = 'INGRESO_MANUAL',
  SALIDA_MANUAL = 'SALIDA_MANUAL',
  INGRESO_COMPRA = 'INGRESO_COMPRA',
  SALIDA_VENTA = 'SALIDA_VENTA',
}

export class RegistrarMovimientoDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsNotEmpty()
  producto_id: string;

  @ApiPropertyOptional({
    description: 'ID de la variante, si el producto la requiere',
  })
  @IsOptional()
  variante_id?: string;

  @ApiProperty({
    enum: TipoMovimiento,
    description: 'Tipo de movimiento de inventario',
  })
  @IsEnum(TipoMovimiento)
  tipo_movimiento: TipoMovimiento;

  @ApiProperty({
    description: 'Cantidad de unidades del movimiento',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({ description: 'Motivo del movimiento' })
  @IsString()
  @IsOptional()
  motivo?: string;
}
