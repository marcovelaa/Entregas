import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token emitido en el login' })
  @IsString()
  refresh_token!: string;
}
