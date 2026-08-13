import { IsOptional, IsString, MinLength } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional() @IsString() @MinLength(1) nombres?: string;
  @IsOptional() @IsString() @MinLength(1) apellidos?: string;
  @IsOptional() @IsString() telefono?: string;
}
