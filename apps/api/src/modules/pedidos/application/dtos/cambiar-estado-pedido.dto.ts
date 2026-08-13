import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EstadoPedido } from '../../domain/entities/estado-pedido.enum';

export class CambiarEstadoPedidoDto {
  @IsEnum(EstadoPedido)
  @IsNotEmpty()
  nuevo_estado: EstadoPedido;

  @IsOptional()
  @IsString()
  motivo?: string;
}
