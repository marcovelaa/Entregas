import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class GetDashboardMetricsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Ventas de Hoy
    const ventasHoyResult = await this.prisma.venta.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        estado: 'COMPLETADA',
        creado_en: { gte: today },
      },
    });

    const totalHoy = Number(ventasHoyResult._sum.total || 0);
    const cantidadHoy = ventasHoyResult._count.id || 0;
    const ticketPromedio = cantidadHoy > 0 ? totalHoy / cantidadHoy : 0;

    // 2. Ventas de los últimos 7 días (para el gráfico de barras)
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    const ventas7Dias = await this.prisma.venta.findMany({
      where: {
        estado: 'COMPLETADA',
        creado_en: { gte: hace7Dias },
      },
      select: {
        total: true,
        creado_en: true,
        metodo_pago: true,
      },
    });

    // Agrupar ventas por día
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const graficoSemanalMap: { [key: string]: number } = {};

    // Inicializar los últimos 7 días con 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(hace7Dias);
      d.setDate(d.getDate() + i);
      const key = diasSemana[d.getDay()];
      graficoSemanalMap[key] = 0;
    }

    // Llenar con datos reales
    ventas7Dias.forEach((v) => {
      const dayName = diasSemana[new Date(v.creado_en).getDay()];
      if (graficoSemanalMap[dayName] !== undefined) {
        graficoSemanalMap[dayName] += Number(v.total);
      }
    });

    const graficoSemanal = Object.keys(graficoSemanalMap).map((dia) => ({
      dia,
      total: graficoSemanalMap[dia],
    }));

    // 3. Distribución por Método de Pago (Hoy / Últimos 7 días)
    const metodosMap: { [key: string]: number } = { EFECTIVO: 0, QR: 0, TARJETA: 0, OTRO: 0 };
    ventas7Dias.forEach((v) => {
      const m = (v.metodo_pago || 'EFECTIVO').toUpperCase();
      if (metodosMap[m] !== undefined) {
        metodosMap[m] += Number(v.total);
      } else {
        metodosMap['OTRO'] += Number(v.total);
      }
    });

    const totalVentasPeriodo = ventas7Dias.reduce((acc, v) => acc + Number(v.total), 0);
    const distribucionPagos = Object.keys(metodosMap).map((metodo) => ({
      metodo,
      monto: metodosMap[metodo],
      porcentaje: totalVentasPeriodo > 0 ? Math.round((metodosMap[metodo] / totalVentasPeriodo) * 100) : 0,
    }));

    // 4. Alertas de Stock (Crítico <= 10)
    const inventariosBajoStock = await this.prisma.inventario.findMany({
      where: {
        cantidad_disponible: { lte: 10 },
      },
      include: {
        producto: true,
      },
      take: 5,
      orderBy: {
        cantidad_disponible: 'asc',
      },
    });

    const alertasStock = inventariosBajoStock.map((inv: any) => ({
      id: inv.id.toString(),
      nombre: inv.producto?.nombre || 'Producto Desconocido',
      sku: inv.producto?.sku || 'N/A',
      stock: inv.cantidad_disponible,
      stockMinimo: inv.stock_minimo,
    }));

    // 5. Estadísticas de Inventario
    const totalProductos = await this.prisma.producto.count({ where: { activo: true } });
    const totalStock = await this.prisma.inventario.aggregate({
      _sum: { cantidad_disponible: true },
    });

    // 6. Ventas Recientes
    const ventasRecientesRaw = await this.prisma.venta.findMany({
      where: { estado: 'COMPLETADA' },
      take: 6,
      orderBy: { creado_en: 'desc' },
      include: { cliente: true },
    });

    const ventasRecientes = ventasRecientesRaw.map((v: any) => ({
      id: v.id.toString(),
      ticket: v.numero_ticket,
      total: Number(v.total),
      metodoPago: v.metodo_pago,
      fecha: v.creado_en,
      cliente: v.cliente ? `${v.cliente.nombres} ${v.cliente.apellidos || ''}`.trim() : 'Cliente General',
    }));

    return {
      success: true,
      data: {
        ventasHoy: {
          total: totalHoy,
          cantidad: cantidadHoy,
          ticketPromedio,
        },
        graficoSemanal,
        distribucionPagos,
        alertasStock,
        resumenInventario: {
          totalProductos,
          totalStock: totalStock._sum.cantidad_disponible || 0,
          itemsCriticos: inventariosBajoStock.length,
        },
        ventasRecientes,
      },
    };
  }
}

