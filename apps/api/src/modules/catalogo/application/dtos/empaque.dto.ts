import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, Min, MaxLength, IsArray, ArrayMinSize } from 'class-validator';

export class CrearEmpaqueDto {
  @IsNumber()
  @IsNotEmpty()
  variante_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sku!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  codigo_barras?: string;

  @IsNumber()
  @Min(1)
  multiplicador_unidades!: number;

  @IsNumber()
  @Min(0)
  precio!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_promocional?: number;
}

export class ActualizarEmpaqueDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sku?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  codigo_barras?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  multiplicador_unidades?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_promocional?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CrearEmpaquesBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CrearEmpaqueDto)
  empaques!: CrearEmpaqueDto[];
}
