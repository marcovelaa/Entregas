import { IsOptional, IsString, IsBoolean, IsEmail } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class ListarClientesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  buscar?: string;
}

export class CrearClienteDto {
  @IsString()
  nombres!: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsString()
  documento_id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;
}

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  nombres?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsString()
  documento_id?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
