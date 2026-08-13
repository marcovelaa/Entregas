import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  EstadoDevolucion,
  ResolucionDevolucion,
  DestinoFisicoItem,
} from '../../domain/entities/devolucion-enums';

export class EvaluarDevolucionDto {
  @IsEnum(EstadoDevolucion)
  estado: EstadoDevolucion;

  @IsEnum(ResolucionDevolucion)
  resolucion: ResolucionDevolucion;

  @IsEnum(DestinoFisicoItem)
  destino_fisico: DestinoFisicoItem;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monto_reembolso?: number;

  @IsOptional()
  @IsString()
  notas_evaluacion?: string;
}
