import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IDescuentoRepository, ReglaDescuentoVigente } from '../../domain/repositories/descuento.repository.interface';

@Injectable()
export class PrismaDescuentoRepository implements IDescuentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarReglasVigentes(params: { now: Date; codigoCupon?: string }): Promise<ReglaDescuentoVigente[]> {
    const { now, codigoCupon } = params;

    const descuentos = await this.prisma.descuento.findMany({
      where: {
        activo: true,
        fecha_inicio: { lte: now },
        fecha_fin: { gte: now },
        codigo_cupon: codigoCupon ? codigoCupon.toUpperCase() : null,
        OR: [{ dias_semana: { isEmpty: true } }, { dias_semana: { has: now.getDay() } }],
      },
      include: {
        productos: true,
        variantes: true,
        empaques: true,
        categorias: true,
      },
      orderBy: [{ prioridad: 'desc' }, { creado_en: 'desc' }],
    });

    return descuentos.map((d) => ({
      id: d.id.toString(),
      nombre: d.nombre,
      codigo_cupon: d.codigo_cupon,
      tipo: d.tipo,
      alcance: d.alcance,
      canal: d.canal,
      valor: Number(d.valor),
      max_monto_descuento: d.max_monto_descuento != null ? Number(d.max_monto_descuento) : null,
      cantidad_requerida: d.cantidad_requerida,
      cantidad_paga: d.cantidad_paga,
      monto_minimo_compra: d.monto_minimo_compra != null ? Number(d.monto_minimo_compra) : null,
      limite_usos: d.limite_usos,
      limite_usos_por_cliente: d.limite_usos_por_cliente,
      usos_actuales: d.usos_actuales,
      prioridad: d.prioridad,
      dias_semana: d.dias_semana,
      hora_inicio: d.hora_inicio,
      hora_fin: d.hora_fin,
      productos: d.productos.map((p) => ({ producto_id: p.producto_id.toString() })),
      variantes: d.variantes.map((v) => ({ variante_id: v.variante_id.toString() })),
      empaques: d.empaques.map((e) => ({ empaque_id: e.empaque_id.toString() })),
      categorias: d.categorias.map((c) => ({ categoria_id: c.categoria_id.toString() })),
    }));
  }

  async contarUsosPorCliente(descuentoId: string, clienteId: string): Promise<number> {
    return this.prisma.descuentoUso.count({
      where: {
        descuento_id: BigInt(descuentoId),
        cliente_id: BigInt(clienteId),
      },
    });
  }
}
