import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  DescuentoActualizarCompletoInput,
  IDescuentoRepository,
} from '../../domain/repositories/descuento.repository.interface';
import { DESCUENTO_REPOSITORY } from '../../domain/repositories/descuento.repository.interface';
import { ActualizarDescuentoDto } from '../dtos/descuento.dto';
import { parseDiasSemana, parseHHMM } from '../../domain/scheduling';

@Injectable()
export class ActualizarDescuentoUseCase {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async execute(id: string, dto: ActualizarDescuentoDto) {
    const data: DescuentoActualizarCompletoInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.codigoCupon !== undefined) {
      data.codigo_cupon = dto.codigoCupon
        ? dto.codigoCupon.trim().toUpperCase()
        : null;
    }
    if (dto.tipo !== undefined) data.tipo = dto.tipo;
    if (dto.valor !== undefined) data.valor = dto.valor;
    if (dto.maxMontoDescuento !== undefined)
      data.max_monto_descuento = dto.maxMontoDescuento ?? null;
    if (dto.alcance !== undefined) data.alcance = dto.alcance;
    if (dto.canal !== undefined) data.canal = dto.canal;
    if (dto.cantidadRequerida !== undefined)
      data.cantidad_requerida = dto.cantidadRequerida;
    if (dto.cantidadPaga !== undefined) data.cantidad_paga = dto.cantidadPaga;
    if (dto.montoMinimoCompra !== undefined)
      data.monto_minimo_compra = dto.montoMinimoCompra ?? null;
    if (dto.limiteUsos !== undefined) data.limite_usos = dto.limiteUsos ?? null;
    if (dto.limiteUsosPorCliente !== undefined)
      data.limite_usos_por_cliente = dto.limiteUsosPorCliente;
    if (dto.prioridad !== undefined) data.prioridad = dto.prioridad;
    if (dto.fechaInicio) data.fecha_inicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fecha_fin = new Date(dto.fechaFin);
    if (dto.activo !== undefined) data.activo = dto.activo;
    if (dto.diasSemana !== undefined)
      data.dias_semana = parseDiasSemana(dto.diasSemana);
    if (dto.horaInicio !== undefined)
      data.hora_inicio = parseHHMM(dto.horaInicio);
    if (dto.horaFin !== undefined) data.hora_fin = parseHHMM(dto.horaFin);

    const reemplazarRelaciones =
      dto.productoIds !== undefined ||
      dto.varianteIds !== undefined ||
      dto.empaqueIds !== undefined ||
      dto.categoriaIds !== undefined;

    if (reemplazarRelaciones) {
      data.productoIds = dto.productoIds;
      data.varianteIds = dto.varianteIds;
      data.empaqueIds = dto.empaqueIds;
      data.categoriaIds = dto.categoriaIds;
    }

    const actualizado = await this.descuentoRepo.actualizarCompleto(
      id,
      data,
      reemplazarRelaciones,
    );
    if (!actualizado) {
      throw new NotFoundException('Descuento no encontrado');
    }

    return { success: true, message: 'Descuento actualizado exitosamente' };
  }
}
