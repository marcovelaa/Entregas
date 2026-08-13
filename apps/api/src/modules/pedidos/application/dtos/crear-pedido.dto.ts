import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DireccionEnvioSnapshotDto {
  @IsString()
  @IsNotEmpty()
  destinatario_nombre: string;

  @IsString()
  @IsNotEmpty()
  destinatario_apellidos: string;

  @IsString()
  @IsNotEmpty()
  direccion_completa: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsOptional()
  @IsString()
  referencia?: string;
}

export class PedidoDetalleCreateDto {
  @IsString()
  @IsNotEmpty()
  producto_id: string;

  @IsOptional()
  @IsString()
  variante_id?: string;

  @IsOptional()
  @IsString()
  empaque_id?: string;

  @IsString()
  @IsNotEmpty()
  nombre_producto: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0)
  precio_unitario: number;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsOptional()
  @IsString()
  imagen_url?: string;
}

export class CrearPedidoDto {
  @IsOptional()
  @IsString()
  reserva_id?: string;

  @ValidateNested()
  @Type(() => DireccionEnvioSnapshotDto)
  direccion_envio: DireccionEnvioSnapshotDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo_envio?: number;

  @IsOptional()
  @IsString()
  metodo_pago?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoDetalleCreateDto)
  detalles: PedidoDetalleCreateDto[];
}
