import { IsNotEmpty, IsOptional, IsString, IsNumber, IsObject, IsBoolean, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class CrearProductoDto {
  @IsNumber()
  @IsNotEmpty()
  categoria_id!: number;

  @IsNumber()
  @IsOptional()
  marca_id?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  naturaleza?: string;

  @IsString()
  @IsOptional()
  unidad_medida?: string;

  @IsObject()
  @IsOptional()
  atributos?: Record<string, any>;

  @IsString()
  @IsOptional()
  tipo_producto?: 'SIMPLE' | 'COMBO' | 'SERVICIO';

  @IsArray()
  @IsOptional()
  componentes_combo?: Array<{
    componente_prod_id: string | number;
    variante_id?: string | number;
    empaque_id?: string | number;
    cantidad: number;
  }>;

  @IsNumber()
  @Min(0)
  precio_base!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_promocional?: number;
}

export class ActualizarProductoDto {
  @IsNumber()
  @IsOptional()
  categoria_id?: number;

  @IsNumber()
  @IsOptional()
  marca_id?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  naturaleza?: string;

  @IsString()
  @IsOptional()
  unidad_medida?: string;

  @IsObject()
  @IsOptional()
  atributos?: Record<string, any>;

  @IsString()
  @IsOptional()
  tipo_producto?: 'SIMPLE' | 'COMBO' | 'SERVICIO';

  @IsArray()
  @IsOptional()
  componentes_combo?: Array<{
    componente_prod_id: string | number;
    variante_id?: string | number;
    empaque_id?: string | number;
    cantidad: number;
  }>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_base?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  precio_promocional?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class ListarProductosDto extends PaginationDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  categoria_id?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  marca_id?: number;

  @IsString()
  @IsOptional()
  tipo_producto?: 'SIMPLE' | 'COMBO' | 'SERVICIO';

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  activo?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
