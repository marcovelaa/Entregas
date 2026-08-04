import { IsOptional, IsString, IsBoolean, IsEmail, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class ListarClientesDto extends PaginationDto {
  @IsOptional()
  @IsString()
  buscar?: string;
}

export class CrearClienteDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nombres!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  apellidos?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  documento_id?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  telefono?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  direccion?: string;
}

export class ActualizarClienteDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  nombres?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  apellidos?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  documento_id?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @ValidateIf((o) => !!o.email)
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  telefono?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : value))
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
