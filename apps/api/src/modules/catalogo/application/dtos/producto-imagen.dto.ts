import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CrearProductoImagenDto {
  @IsNumber()
  @IsNotEmpty()
  producto_id: bigint;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  texto_alternativo?: string;

  @IsNumber()
  @IsOptional()
  orden?: number;

  @IsBoolean()
  @IsOptional()
  es_principal?: boolean;
}
