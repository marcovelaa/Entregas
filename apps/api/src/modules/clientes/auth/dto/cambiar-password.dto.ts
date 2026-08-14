import { IsString, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString() @MinLength(1) password_actual!: string;
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password_nueva!: string;
}
