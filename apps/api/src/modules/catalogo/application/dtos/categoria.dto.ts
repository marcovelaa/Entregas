import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CrearCategoriaDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsNumber()
  @IsOptional()
  categoria_padre_id?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsOptional()
  plantilla_atributos?: any;
}

export class ActualizarCategoriaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @IsOptional()
  categoria_padre_id?: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsOptional()
  plantilla_atributos?: any;
}

export class ListarCategoriasDto {
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  activo?: boolean;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  padre_id?: number;
}
