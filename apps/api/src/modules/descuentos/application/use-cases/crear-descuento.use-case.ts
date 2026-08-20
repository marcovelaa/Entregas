import { Inject, Injectable } from '@nestjs/common';
import type { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';
import { DESCUENTO_REPOSITORY } from '../../domain/repositories/descuento.repository.interface';
import { CrearDescuentoDto } from '../dtos/descuento.dto';
import { parseDiasSemana, parseHHMM } from '../../domain/scheduling';

@Injectable()
export class CrearDescuentoUseCase {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async execute(dto: CrearDescuentoDto) {
    const nuevo = await this.descuentoRepo.crear({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      codigo_cupon: dto.codigoCupon
        ? dto.codigoCupon.trim().toUpperCase()
        : null,
      tipo: dto.tipo || 'PORCENTAJE',
      valor: dto.valor || 0,
      max_monto_descuento: dto.maxMontoDescuento ?? null,
      alcance: dto.alcance || 'GLOBAL',
      canal: dto.canal || 'TODOS',
      cantidad_requerida: dto.cantidadRequerida ?? 1,
      cantidad_paga: dto.cantidadPaga ?? 1,
      monto_minimo_compra: dto.montoMinimoCompra ?? null,
      limite_usos: dto.limiteUsos ?? null,
      limite_usos_por_cliente: dto.limiteUsosPorCliente ?? 1,
      prioridad: dto.prioridad ?? 0,
      fecha_inicio: new Date(dto.fechaInicio),
      fecha_fin: new Date(dto.fechaFin),
      dias_semana: parseDiasSemana(dto.diasSemana),
      hora_inicio: parseHHMM(dto.horaInicio),
      hora_fin: parseHHMM(dto.horaFin),
      productoIds: dto.productoIds,
      varianteIds: dto.varianteIds,
      empaqueIds: dto.empaqueIds,
      categoriaIds: dto.categoriaIds,
    });

    return {
      success: true,
      message: 'Descuento creado exitosamente',
      data: { id: nuevo.id },
    };
  }
}
