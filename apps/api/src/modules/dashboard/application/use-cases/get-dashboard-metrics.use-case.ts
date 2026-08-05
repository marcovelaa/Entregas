import { Inject, Injectable } from '@nestjs/common';
import { DASHBOARD_REPOSITORY } from '../../domain/repositories/dashboard.repository.interface';
import type { IDashboardRepository } from '../../domain/repositories/dashboard.repository.interface';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

@Injectable()
export class GetDashboardMetricsUseCase {
  constructor(@Inject(DASHBOARD_REPOSITORY) private readonly dashboardRepo: IDashboardRepository) {}

  async execute() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    const [ventasHoy, ventasSemana, distribucionRaw, alertasStock, totalProductos, totalStock, ventasRecientes] =
      await Promise.all([
        this.dashboardRepo.obtenerVentasHoy(today),
        this.dashboardRepo.obtenerVentasDesde(hace7Dias),
        this.dashboardRepo.obtenerDistribucionPorMetodoPago(hace7Dias),
        this.dashboardRepo.obtenerAlertasStock(10, 5),
        this.dashboardRepo.contarProductosActivos(),
        this.dashboardRepo.sumarStockDisponible(),
        this.dashboardRepo.obtenerVentasRecientes(6),
      ]);

    // Agrupar ventas de la última semana por día (Dom-Sáb)
    const graficoSemanalMap: { [key: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(hace7Dias);
      d.setDate(d.getDate() + i);
      graficoSemanalMap[DIAS_SEMANA[d.getDay()]] = 0;
    }
    ventasSemana.forEach((v) => {
      const dayName = DIAS_SEMANA[new Date(v.creado_en).getDay()];
      if (graficoSemanalMap[dayName] !== undefined) {
        graficoSemanalMap[dayName] += v.total;
      }
    });
    const graficoSemanal = Object.keys(graficoSemanalMap).map((dia) => ({
      dia,
      total: graficoSemanalMap[dia],
    }));

    // Distribución por método de pago: fijar los métodos conocidos en 0 y sumar lo que
    // devolvió la base (agregado server-side), enviando cualquier método desconocido a OTRO.
    const metodosMap: { [key: string]: number } = { EFECTIVO: 0, QR: 0, TARJETA: 0, OTRO: 0 };
    distribucionRaw.forEach((d) => {
      if (metodosMap[d.metodo] !== undefined) {
        metodosMap[d.metodo] += d.monto;
      } else {
        metodosMap['OTRO'] += d.monto;
      }
    });
    const totalVentasPeriodo = Object.values(metodosMap).reduce((acc, v) => acc + v, 0);
    const distribucionPagos = Object.keys(metodosMap).map((metodo) => ({
      metodo,
      monto: metodosMap[metodo],
      porcentaje: totalVentasPeriodo > 0 ? Math.round((metodosMap[metodo] / totalVentasPeriodo) * 100) : 0,
    }));

    const ticketPromedio = ventasHoy.cantidad > 0 ? ventasHoy.total / ventasHoy.cantidad : 0;

    return {
      success: true,
      data: {
        ventasHoy: {
          total: ventasHoy.total,
          cantidad: ventasHoy.cantidad,
          ticketPromedio,
        },
        graficoSemanal,
        distribucionPagos,
        alertasStock,
        resumenInventario: {
          totalProductos,
          totalStock,
          itemsCriticos: alertasStock.length,
        },
        ventasRecientes: ventasRecientes.map((v) => ({
          id: v.id,
          ticket: v.ticket,
          total: v.total,
          metodoPago: v.metodoPago,
          fecha: v.fecha,
          cliente: v.clienteNombre || 'Cliente General',
        })),
      },
    };
  }
}
