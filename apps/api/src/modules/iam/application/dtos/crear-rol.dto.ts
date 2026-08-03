import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CrearRolDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
