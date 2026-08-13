import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DevolucionDetalleItemDto {
  @IsString()
  @IsNotEmpty()
  pedido_detalle_id: string;

  @IsString()
  @IsNotEmpty()
  producto_id: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsOptional()
  @IsString()
  motivo_item?: string;
}

export class SolicitarDevolucionDto {
  @IsString()
  @IsNotEmpty()
  pedido_id: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DevolucionDetalleItemDto)
  detalles: DevolucionDetalleItemDto[];
}
