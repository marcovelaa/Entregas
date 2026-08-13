import { Inject, Injectable } from '@nestjs/common';
import {
  BITACORA_REPOSITORY,
  type IBitacoraRepository,
  type BitacoraData,
} from '../../domain/repositories/bitacora.repository.interface';

@Injectable()
export class ListarBitacoraErpUseCase {
  constructor(
    @Inject(BITACORA_REPOSITORY)
    private readonly bitacoraRepo: IBitacoraRepository,
  ) {}

  async execute(params: {
    offset?: number;
    limit?: number;
    entidad?: string;
    usuario_id?: string;
    cliente_id?: string;
    operacion?: string;
  }): Promise<{ total: number; data: BitacoraData[] }> {
    return this.bitacoraRepo.listarErp({
      offset: params.offset || 0,
      limit: params.limit || 50,
      entidad: params.entidad,
      usuario_id: params.usuario_id,
      cliente_id: params.cliente_id,
      operacion: params.operacion,
    });
  }
}
