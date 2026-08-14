import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsIn,
} from 'class-validator';

export class RegistrarMovimientoDto {
  @IsNotEmpty()
  @IsString()
  productoId: string; // Passed as string from JSON, parsed to bigint in use case

  @IsOptional()
  @IsString()
  varianteId?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsNotEmpty()
  @IsIn(['ENTRADA', 'SALIDA', 'AJUSTE'])
  tipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';

  @IsNotEmpty()
  @IsString()
  motivo: string;

  @IsOptional()
  @IsString()
  tipoDocumento?: string;

  @IsOptional()
  @IsString()
  documentoId?: string;
}
