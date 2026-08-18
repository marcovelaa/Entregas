import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class UpdateUsuarioDto {
  @IsString()
  @IsOptional()
  rolId?: string;

  @IsString()
  @IsOptional()
  nombres?: string;

  @IsString()
  @IsOptional()
  apellidos?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  codigoReferido?: string;
}
