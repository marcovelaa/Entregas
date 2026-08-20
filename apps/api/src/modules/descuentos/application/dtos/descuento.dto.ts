import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  TipoDescuento,
  AlcanceDescuento,
  CanalDescuento,
} from '@prisma/client';

export class CrearDescuentoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  codigoCupon?: string;

  @IsEnum(TipoDescuento)
  @IsOptional()
  tipo?: TipoDescuento;

  @IsNumber()
  @IsOptional()
  valor?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxMontoDescuento?: number;

  @IsEnum(AlcanceDescuento)
  @IsOptional()
  alcance?: AlcanceDescuento;

  @IsEnum(CanalDescuento)
  @IsOptional()
  canal?: CanalDescuento;

  @IsInt()
  @Min(1)
  @IsOptional()
  cantidadRequerida?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  cantidadPaga?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  montoMinimoCompra?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  limiteUsos?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  limiteUsosPorCliente?: number;

  @IsInt()
  @IsOptional()
  prioridad?: number;

  @IsString()
  @IsNotEmpty()
  fechaInicio!: string;

  @IsString()
  @IsNotEmpty()
  fechaFin!: string;

  @IsArray()
  @IsOptional()
  diasSemana?: number[];

  @IsString()
  @IsOptional()
  horaInicio?: string;

  @IsString()
  @IsOptional()
  horaFin?: string;

  @IsArray()
  @IsOptional()
  productoIds?: string[];

  @IsArray()
  @IsOptional()
  varianteIds?: string[];

  @IsArray()
  @IsOptional()
  empaqueIds?: string[];

  @IsArray()
  @IsOptional()
  categoriaIds?: string[];
}

export class ActualizarDescuentoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  codigoCupon?: string;

  @IsEnum(TipoDescuento)
  @IsOptional()
  tipo?: TipoDescuento;

  @IsNumber()
  @IsOptional()
  valor?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxMontoDescuento?: number;

  @IsEnum(AlcanceDescuento)
  @IsOptional()
  alcance?: AlcanceDescuento;

  @IsEnum(CanalDescuento)
  @IsOptional()
  canal?: CanalDescuento;

  @IsInt()
  @Min(1)
  @IsOptional()
  cantidadRequerida?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  cantidadPaga?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  montoMinimoCompra?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  limiteUsos?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  limiteUsosPorCliente?: number;

  @IsInt()
  @IsOptional()
  prioridad?: number;

  @IsString()
  @IsOptional()
  fechaInicio?: string;

  @IsString()
  @IsOptional()
  fechaFin?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsArray()
  @IsOptional()
  diasSemana?: number[];

  @IsString()
  @IsOptional()
  horaInicio?: string;

  @IsString()
  @IsOptional()
  horaFin?: string;

  @IsArray()
  @IsOptional()
  productoIds?: string[];

  @IsArray()
  @IsOptional()
  varianteIds?: string[];

  @IsArray()
  @IsOptional()
  empaqueIds?: string[];

  @IsArray()
  @IsOptional()
  categoriaIds?: string[];
}

export class ActualizarParcialDescuentoDto {
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsInt()
  @IsOptional()
  prioridad?: number;

  @IsNumber()
  @IsOptional()
  valor?: number;

  @IsString()
  @IsOptional()
  fechaInicio?: string;

  @IsString()
  @IsOptional()
  fechaFin?: string;

  @IsArray()
  @IsOptional()
  diasSemana?: number[];

  @IsString()
  @IsOptional()
  horaInicio?: string;

  @IsString()
  @IsOptional()
  horaFin?: string;
}
