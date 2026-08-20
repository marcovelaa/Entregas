import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IDescuentoRepository } from '../../domain/repositories/descuento.repository.interface';
import { DESCUENTO_REPOSITORY } from '../../domain/repositories/descuento.repository.interface';

@Injectable()
export class ObtenerAnaliticaDescuentoUseCase {
  constructor(
    @Inject(DESCUENTO_REPOSITORY)
    private readonly descuentoRepo: IDescuentoRepository,
  ) {}

  async execute(id: string) {
    const descuento = await this.descuentoRepo.buscarPorId(id);
    if (!descuento) {
      throw new NotFoundException('Descuento no encontrado');
    }

    const usos = await this.descuentoRepo.buscarUsosConDetalle(id);

    let totalVentasBs = 0;
    let totalDescontadoBs = 0;
    const productCountMap = new Map<
      string,
      { nombre: string; cantidad: number; totalBs: number }
    >();
    const dailyMap = new Map<
      string,
      { fecha: string; canjes: number; descontadoBs: number }
    >();

    for (const u of usos) {
      totalDescontadoBs += u.montoDescontado;
      totalVentasBs += u.montoVenta;

      const dayKey = u.fecha.toISOString().split('T')[0];
      const existingDay = dailyMap.get(dayKey) || {
        fecha: dayKey,
        canjes: 0,
        descontadoBs: 0,
      };
      existingDay.canjes += 1;
      existingDay.descontadoBs += u.montoDescontado;
      dailyMap.set(dayKey, existingDay);

      for (const p of u.productos) {
        const existingProd = productCountMap.get(p.id) || {
          nombre: p.nombre,
          cantidad: 0,
          totalBs: 0,
        };
        existingProd.cantidad += p.cantidad;
        existingProd.totalBs += p.subtotal;
        productCountMap.set(p.id, existingProd);
      }
    }

    const totalUsos = usos.length;
    const ticketPromedioBs = totalUsos > 0 ? totalVentasBs / totalUsos : 0;

    const topProductos = Array.from(productCountMap.values())
      .sort((a, b) => b.totalBs - a.totalBs)
      .slice(0, 5);

    const historialDiario = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    return {
      success: true,
      data: {
        descuentoId: descuento.id,
        nombre: descuento.nombre,
        tipo: descuento.tipo,
        codigoCupon: descuento.codigo_cupon,
        canal: descuento.canal,
        activo: descuento.activo,
        totalUsos,
        totalVentasBs,
        totalDescontadoBs,
        ticketPromedioBs,
        topProductos,
        historialDiario,
        ultimosCanjes: usos.slice(0, 10).map((u) => ({
          id: u.id,
          ventaId: u.ventaId,
          clienteNombre: u.clienteNombre,
          montoDescontado: u.montoDescontado,
          montoVenta: u.montoVenta,
          fecha: u.fecha,
        })),
      },
    };
  }
}
