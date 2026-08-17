import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class ListarVentasDto extends PaginationDto {}

export class VentaDetalleDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  producto_id!: string;

  @ApiPropertyOptional({
    description: 'ID de la variante, si el producto la requiere',
  })
  @IsOptional()
  @IsString()
  variante_id?: string;

  @ApiPropertyOptional({
    description: 'ID del empaque/presentación, si aplica',
  })
  @IsOptional()
  @IsString()
  empaque_id?: string;

  @ApiProperty({
    description: 'Cantidad de unidades de la presentación vendida',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  cantidad!: number;

  @ApiProperty({
    description:
      'Precio unitario propuesto por el cliente. Es solo informativo: el backend siempre recalcula el precio real de catálogo y exige aprobación de un administrador si este valor implica una rebaja.',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  precio_unitario!: number;

  @ApiPropertyOptional({
    description: 'Motivo de la rebaja manual de precio, si aplica',
  })
  @IsOptional()
  @IsString()
  motivo_ajuste?: string;
}

export class RegistrarVentaDto {
  @ApiPropertyOptional({
    description:
      'ID del cliente. Si se omite, la venta queda como consumidor final',
  })
  @IsOptional()
  @IsString()
  cliente_id?: string;

  @ApiProperty({
    description:
      'UUID único generado por el POS para que los reintentos del mismo cobro sean idempotentes',
  })
  @IsString()
  @MaxLength(100)
  idempotency_key!: string;

  @ApiProperty({ description: 'Método de pago', example: 'EFECTIVO' })
  @IsString()
  metodo_pago!: string;

  @ApiProperty({ description: 'Monto pagado por el cliente', minimum: 0 })
  @IsNumber()
  @Min(0)
  monto_pagado!: number;

  @ApiPropertyOptional({
    description:
      'ID de un descuento a aplicar (opcional si se envía codigo_cupon)',
  })
  @IsOptional()
  @IsString()
  descuento_id?: string;

  @ApiPropertyOptional({
    description:
      'Descuento propuesto por el cliente. Es solo informativo: el backend siempre recalcula el monto real vía el motor de descuentos y lo ignora.',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  descuento_total?: number;

  @ApiPropertyOptional({ description: 'Código de cupón a validar y aplicar' })
  @IsOptional()
  @IsString()
  codigo_cupon?: string;

  @ApiPropertyOptional({
    description:
      'ID del administrador que autorizó una rebaja manual de precio (requerido si algún detalle vende por debajo del precio de catálogo)',
  })
  @IsOptional()
  @IsString()
  aprobador_usuario_id?: string;

  @ApiPropertyOptional({
    description: 'Motivo general de la rebaja manual de precio',
  })
  @IsOptional()
  @IsString()
  motivo_ajuste?: string;

  @ApiPropertyOptional({
    description:
      'ID público de una reserva de inventario activa. Al completar la venta se consume y descuenta su stock reservado.',
  })
  @IsOptional()
  @IsString()
  reserva_id?: string;

  @ApiProperty({ description: 'Ítems del carrito', type: [VentaDetalleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentaDetalleDto)
  detalles!: VentaDetalleDto[];
}

export class ReservaInventarioDetalleDto {
  @ApiProperty({
    description: 'ID del producto cuyo inventario se reserva en unidades base',
  })
  @IsString()
  producto_id!: string;

  @ApiPropertyOptional({
    description:
      'ID de variante; omitir solo cuando el inventario no usa variante',
  })
  @IsOptional()
  @IsString()
  variante_id?: string;

  @ApiProperty({
    description: 'Cantidad de unidades base a reservar',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  cantidad!: number;
}

export class CrearReservaInventarioDto {
  @ApiProperty({
    type: [ReservaInventarioDetalleDto],
    description:
      'Líneas físicas de inventario del checkout, expresadas en unidades base',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservaInventarioDetalleDto)
  detalles!: ReservaInventarioDetalleDto[];
}
