import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
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

  @IsNumber()
  cantidad: number;

  @IsNumber()
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
  @IsString()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompraDetalleDto)
  detalles: CompraDetalleDto[];
}

export class ListarComprasDto extends PaginationDto {}
