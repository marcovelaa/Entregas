import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegistroClienteDto {
  @IsString() @MinLength(1) nombres!: string;
  @IsString() @MinLength(1) apellidos!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() telefono?: string;
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}
