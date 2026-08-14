import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  MaxLength,
  ValidateNested,
  ArrayMaxSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearVarianteDto {
  @IsNumber()
  @IsNotEmpty()
  producto_id!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sku_base!: string;

  @IsString()
  @IsOptional()
  imagen_url?: string;
}

export class ActualizarVarianteDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  nombre?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  sku_base?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  imagen_url?: string;
}

export class CrearVariantesBulkDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CrearVarianteDto)
  variantes!: CrearVarianteDto[];
}
