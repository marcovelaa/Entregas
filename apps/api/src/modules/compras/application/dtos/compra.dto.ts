import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class CompraDetalleDto {
  @IsString()
  producto_id: string;

  @IsOptional()
  @IsString()
  variante_id?: string;

  @IsOptional()
  @IsString()
  empaque_id?: string;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  costo_unitario: number;

  @IsOptional()
  @IsNumber()
  precio_venta?: number;
}

export class RegistrarCompraDto {
  @IsOptional()
  @IsString()
  proveedor_id?: string;

  @IsOptional()
  @IsString()
  numero_recibo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_transporte?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  estado?: string; // BORRADOR, EMITIDA, RECIBIDA

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraDetalleDto)
  detalles: CompraDetalleDto[];
}

export class RecibirItemDto {
  @IsString()
  detalle_id: string;

  @IsInt()
  @Min(1)
  cantidad_recibida: number;
}

export class RecibirCompraDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_transporte_adicional?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecibirItemDto)
  detalles_recibidos: RecibirItemDto[];
}

export class ActualizarEstadoCompraDto {
  @IsString()
  estado: string;
}

export class ListarComprasDto extends PaginationDto {}
