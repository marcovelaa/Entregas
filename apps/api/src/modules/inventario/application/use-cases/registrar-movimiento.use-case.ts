import { IInventarioRepository } from '../../domain/repositories/inventario.repository.interface';
import { RegistrarMovimientoDto } from '../dto/registrar-movimiento.dto';

export class RegistrarMovimientoUseCase {
  constructor(private readonly inventarioRepo: IInventarioRepository) {}

  async execute(dto: RegistrarMovimientoDto, usuario_id: bigint) {
    const mov = await this.inventarioRepo.registrarMovimiento({
      producto_id: BigInt(dto.producto_id),
      variante_id: dto.variante_id ? BigInt(dto.variante_id) : undefined,
      tipo_movimiento: dto.tipo_movimiento,
      cantidad: dto.cantidad,
      motivo: dto.motivo,
      usuario_id: usuario_id,
    });

    return {
      ...mov,
      id: mov.id.toString(),
      producto_id: mov.producto_id.toString(),
      variante_id: mov.variante_id?.toString(),
      usuario_id: mov.usuario_id?.toString(),
      documento_origen_id: mov.documento_origen_id?.toString()
    };
  }
}
