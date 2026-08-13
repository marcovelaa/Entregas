import { IsOptional, IsString, MinLength } from 'class-validator';

export class CrearDireccionDto {
  @IsString() @MinLength(1) alias!: string;
  @IsString() @MinLength(1) destinatario_nombre!: string;
  @IsString() @MinLength(1) destinatario_apellidos!: string;
  @IsString() @MinLength(1) direccion_completa!: string;
  @IsString() @MinLength(1) ciudad!: string;
  @IsString() @MinLength(1) telefono!: string;
  @IsOptional() @IsString() referencia?: string;
}

export class ActualizarDireccionDto {
  @IsOptional() @IsString() @MinLength(1) alias?: string;
  @IsOptional() @IsString() @MinLength(1) destinatario_nombre?: string;
  @IsOptional() @IsString() @MinLength(1) destinatario_apellidos?: string;
  @IsOptional() @IsString() @MinLength(1) direccion_completa?: string;
  @IsOptional() @IsString() @MinLength(1) ciudad?: string;
  @IsOptional() @IsString() @MinLength(1) telefono?: string;
  @IsOptional() @IsString() referencia?: string;
}
