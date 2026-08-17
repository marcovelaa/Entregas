import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IGastosRepository, GastoData } from '../../domain/repositories/gastos.repository.interface';

@Injectable()
export class PrismaGastosRepository implements IGastosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(params: { offset: number; limit: number; categoria?: string }): Promise<{ total: number; data: GastoData[] }> {
    const where = params.categoria ? { categoria: params.categoria } : {};
    
    const [total, data] = await Promise.all([
      this.prisma.gastoOperativo.count({ where }),
      this.prisma.gastoOperativo.findMany({
        where,
        skip: params.offset,
        take: params.limit,
        orderBy: { fecha_gasto: 'desc' },
        include: {
          usuario: { select: { nombres: true, apellidos: true } }
        }
      })
    ]);

    return {
      total,
      data: data.map(d => this.serialize(d)),
    };
  }

  async crear(params: { usuario_id: string; categoria: string; descripcion: string; monto: number; fecha_gasto?: Date }): Promise<GastoData> {
    const gasto = await this.prisma.gastoOperativo.create({
      data: {
        usuario_id: BigInt(params.usuario_id),
        categoria: params.categoria,
        descripcion: params.descripcion,
        monto: params.monto,
        fecha_gasto: params.fecha_gasto || new Date(),
      }
    });

    return this.serialize(gasto);
  }

  async eliminar(id: string): Promise<void> {
    await this.prisma.gastoOperativo.delete({
      where: { id: BigInt(id) }
    });
  }

  private serialize(gasto: any): GastoData {
    return {
      id: gasto.id.toString(),
      usuario_id: gasto.usuario_id.toString(),
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: Number(gasto.monto),
      fecha_gasto: gasto.fecha_gasto,
      usuario: gasto.usuario,
    };
  }
}
