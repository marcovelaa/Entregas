import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class CrearMarcaDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class ActualizarMarcaDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class ListarMarcasDto extends PaginationDto {
  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
