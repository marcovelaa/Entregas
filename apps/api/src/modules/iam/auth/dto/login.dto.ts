import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email del usuario' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(1)
  password!: string;
}
