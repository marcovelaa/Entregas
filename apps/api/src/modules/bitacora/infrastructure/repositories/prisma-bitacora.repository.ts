import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IBitacoraRepository,
  BitacoraCreateData,
  BitacoraData,
} from '../../domain/repositories/bitacora.repository.interface';
import { TipoActorBitacora } from '../../domain/entities/bitacora-enums';

@Injectable()
export class PrismaBitacoraRepository implements IBitacoraRepository {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(data: BitacoraCreateData): Promise<BitacoraData> {
    const registro = await this.prisma.bitacora.create({
      data: {
        tipo_actor: data.tipo_actor || TipoActorBitacora.USUARIO,
        usuario_id: data.usuario_id ? BigInt(data.usuario_id) : null,
        cliente_id: data.cliente_id ? BigInt(data.cliente_id) : null,
        request_id: data.request_id || null,
        ip: data.ip || null,
        user_agent: data.user_agent || null,
        entidad: data.entidad,
        entidad_id: data.entidad_id || null,
        operacion: data.operacion,
        datos_anteriores: data.datos_anteriores ?? undefined,
        datos_nuevos: data.datos_nuevos ?? undefined,
      },
    });
    return this.serialize(registro);
  }

  async listarErp(params: {
    offset: number;
    limit: number;
    entidad?: string;
    usuario_id?: string;
    cliente_id?: string;
    operacion?: string;
  }): Promise<{ total: number; data: BitacoraData[] }> {
    const where: any = {};
    if (params.entidad) {
      where.entidad = params.entidad;
    }
    if (params.usuario_id) {
      where.usuario_id = BigInt(params.usuario_id);
    }
    if (params.cliente_id) {
      where.cliente_id = BigInt(params.cliente_id);
    }
    if (params.operacion) {
      where.operacion = params.operacion;
    }

    const [total, data] = await Promise.all([
      this.prisma.bitacora.count({ where }),
      this.prisma.bitacora.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { creado_en: 'desc' },
      }),
    ]);

    return {
      total,
      data: data.map((r) => this.serialize(r)),
    };
  }

  private serialize(registro: any): BitacoraData {
    return {
      id: registro.id.toString(),
      public_id: registro.public_id,
      tipo_actor: registro.tipo_actor,
      usuario_id: registro.usuario_id ? registro.usuario_id.toString() : null,
      cliente_id: registro.cliente_id ? registro.cliente_id.toString() : null,
      request_id: registro.request_id,
      ip: registro.ip,
      user_agent: registro.user_agent,
      entidad: registro.entidad,
      entidad_id: registro.entidad_id,
      operacion: registro.operacion,
      datos_anteriores: registro.datos_anteriores,
      datos_nuevos: registro.datos_nuevos,
      creado_en: registro.creado_en,
    };
  }
}
