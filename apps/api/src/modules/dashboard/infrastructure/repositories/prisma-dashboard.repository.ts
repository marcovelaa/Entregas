import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  AlertaStock,
  DistribucionPago,
  IDashboardRepository,
  VentaDelDia,
  VentaReciente,
  VentasHoy,
} from '../../domain/repositories/dashboard.repository.interface';

@Injectable()
export class PrismaDashboardRepository implements IDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerVentasHoy(desde: Date): Promise<VentasHoy> {
    const result = await this.prisma.venta.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: { estado: 'COMPLETADA', creado_en: { gte: desde } },
    });

    return {
      total: Number(result._sum.total || 0),
      cantidad: result._count.id || 0,
    };
  }

  async obtenerVentasDesde(desde: Date): Promise<VentaDelDia[]> {
    const ventas = await this.prisma.venta.findMany({
      where: { estado: 'COMPLETADA', creado_en: { gte: desde } },
      select: { total: true, creado_en: true },
    });

    return ventas.map((v) => ({
      total: Number(v.total),
      creado_en: v.creado_en,
    }));
  }

  async obtenerDistribucionPorMetodoPago(
    desde: Date,
  ): Promise<DistribucionPago[]> {
    const grupos = await this.prisma.venta.groupBy({
      by: ['metodo_pago'],
      _sum: { total: true },
      where: { estado: 'COMPLETADA', creado_en: { gte: desde } },
    });

    return grupos.map((g) => ({
      metodo: (g.metodo_pago || 'EFECTIVO').toUpperCase(),
      monto: Number(g._sum.total || 0),
    }));
  }

  async obtenerAlertasStock(
    umbral: number,
    limite: number,
  ): Promise<AlertaStock[]> {
    const inventarios = await this.prisma.inventario.findMany({
      where: { cantidad_disponible: { lte: umbral } },
      include: { producto: true },
      take: limite,
      orderBy: { cantidad_disponible: 'asc' },
    });

    return inventarios.map((inv) => ({
      id: inv.id.toString(),
      nombre: inv.producto?.nombre || 'Producto Desconocido',
      sku: inv.producto?.sku || 'N/A',
      stock: inv.cantidad_disponible,
      stockMinimo: inv.stock_minimo,
    }));
  }

  async contarProductosActivos(): Promise<number> {
    return this.prisma.producto.count({ where: { activo: true } });
  }

  async sumarStockDisponible(): Promise<number> {
    const result = await this.prisma.inventario.aggregate({
      _sum: { cantidad_disponible: true },
    });
    return result._sum.cantidad_disponible || 0;
  }

  async obtenerVentasRecientes(limite: number): Promise<VentaReciente[]> {
    const ventas = await this.prisma.venta.findMany({
      where: { estado: 'COMPLETADA' },
      take: limite,
      orderBy: { creado_en: 'desc' },
      include: { cliente: true },
    });

    return ventas.map((v) => ({
      id: v.id.toString(),
      ticket: v.numero_ticket,
      total: Number(v.total),
      metodoPago: v.metodo_pago,
      fecha: v.creado_en,
      clienteNombre: v.cliente ? v.cliente.nombre : null,
    }));
  }
}
