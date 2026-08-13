import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { ActualizarEstadoCompraDto } from '../dtos/compra.dto';
import { BitacoraService } from '../../../bitacora/application/services/bitacora.service';
import { TipoActorBitacora, EntidadBitacora } from '../../../bitacora/domain/entities/bitacora-enums';

@Injectable()
export class ActualizarEstadoCompraUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitacoraService: BitacoraService,
  ) {}

  async execute(compraId: string, dto: ActualizarEstadoCompraDto, usuarioId: string) {
    const compra = await this.prisma.compra.findUnique({
      where: { id: BigInt(compraId) },
    });

    if (!compra) {
      throw new NotFoundException('La orden de compra no existe');
    }

    if (compra.estado === 'RECIBIDA' || compra.estado === 'CANCELADA') {
      throw new BadRequestException(
        `No se puede cambiar el estado de una compra en estado final ${compra.estado}`,
      );
    }

    const compraActualizada = await this.prisma.compra.update({
      where: { id: BigInt(compraId) },
      data: { estado: dto.estado },
    });

    await this.bitacoraService.registrar({
      tipo_actor: TipoActorBitacora.USUARIO,
      usuario_id: usuarioId,
      entidad: EntidadBitacora.COMPRA,
      entidad_id: compraId,
      operacion: 'CAMBIO_ESTADO_COMPRA',
      datos_anteriores: { estado: compra.estado },
      datos_nuevos: { estado: dto.estado },
    });

    return {
      success: true,
      compraId: compraActualizada.id.toString(),
      estado: compraActualizada.estado,
    };
  }
}
