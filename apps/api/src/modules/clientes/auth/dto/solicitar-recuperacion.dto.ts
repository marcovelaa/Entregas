import { IsEmail } from 'class-validator';

export class SolicitarRecuperacionDto {
  @IsEmail() email!: string;
}
