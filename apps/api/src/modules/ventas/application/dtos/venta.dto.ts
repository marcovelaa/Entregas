import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class ListarVentasDto extends PaginationDto {}

export class VentaDetalleDto {
  @IsString()
  producto_id!: string;

  @IsOptional()
  @IsString()
  variante_id?: string;

  @IsOptional()
  @IsString()
  empaque_id?: string;

  @IsNumber()
  @Min(1)
  cantidad!: number;

  @IsNumber()
  @Min(0)
  precio_unitario!: number;

  @IsOptional()
  @IsString()
  motivo_ajuste?: string;
}

export class RegistrarVentaDto {
  @IsOptional()
  @IsString()
  cliente_id?: string;

  @IsString()
  metodo_pago!: string;

  @IsNumber()
  @Min(0)
  monto_pagado!: number;

  @IsOptional()
  @IsString()
  descuento_id?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento_total?: number;

  @IsOptional()
  @IsString()
  codigo_cupon?: string;

  @IsOptional()
  @IsString()
  aprobador_usuario_id?: string;

  @IsOptional()
  @IsString()
  motivo_ajuste?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentaDetalleDto)
  detalles!: VentaDetalleDto[];
}
