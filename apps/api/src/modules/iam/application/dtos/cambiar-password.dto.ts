import { IsString, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
