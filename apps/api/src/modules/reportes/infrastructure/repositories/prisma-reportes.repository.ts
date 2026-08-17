import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { IReportesRepository } from '../../domain/repositories/reportes.repository.interface';
import { GetReporteVentasDto } from '../dto/get-reporte-ventas.dto';

@Injectable()
export class PrismaReportesRepository implements IReportesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerReporteVentas(filtros: GetReporteVentasDto) {
    const { page = 1, limit = 20, startDate, endDate, metodoPago, estado, vendedorId } = filtros;
    
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.creado_en = {};
      if (startDate) whereClause.creado_en.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.creado_en.lte = end;
      }
    }

    if (metodoPago) {
      whereClause.metodo_pago = metodoPago;
    }

    if (estado) {
      whereClause.estado = estado;
    }

    if (vendedorId) {
      whereClause.usuario_id = vendedorId;
    }

    if (filtros.canalVenta) {
      whereClause.canal_venta = filtros.canalVenta;
    }

    if (filtros.search) {
      whereClause.OR = [
        { numero_ticket: { contains: filtros.search, mode: 'insensitive' } },
        {
          cliente: {
            nombre: { contains: filtros.search, mode: 'insensitive' }
          }
        }
      ];
    }

    if (filtros.tieneDescuento === 'SI') {
      whereClause.descuento_total = { gt: 0 };
    } else if (filtros.tieneDescuento === 'NO') {
      whereClause.descuento_total = 0;
    }

    const skip = (page - 1) * limit;

    const [totalRecords, data, aggregations] = await Promise.all([
      this.prisma.venta.count({ where: whereClause }),
      this.prisma.venta.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { creado_en: 'desc' },
        include: {
          cliente: {
            select: { nombre: true, documento_id: true }
          },
          usuario: {
            select: { nombres: true, apellidos: true }
          },
          detalles: {
            select: { cantidad: true }
          }
        }
      }),
      this.prisma.venta.aggregate({
        where: whereClause,
        _sum: { total: true, descuento_total: true }
      })
    ]);

    const mappedData = data.map(v => ({
      id: v.id.toString(),
      numeroTicket: v.numero_ticket,
      fecha: v.creado_en,
      cliente: v.cliente?.nombre || 'Cliente General',
      clienteDocumento: v.cliente?.documento_id || '',
      vendedor: `${v.usuario.nombres} ${v.usuario.apellidos}`.trim(),
      total: Number(v.total),
      descuentoTotal: Number(v.descuento_total),
      montoPagado: Number(v.monto_pagado),
      vuelto: Number(v.vuelto),
      metodoPago: v.metodo_pago,
      estado: v.estado,
      canalVenta: v.canal_venta,
      cantidadArticulos: v.detalles.reduce((sum, d) => sum + d.cantidad, 0)
    }));

    return {
      data: mappedData,
      meta: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
        totalMonto: Number(aggregations._sum.total || 0),
        totalDescuento: Number(aggregations._sum.descuento_total || 0)
      }
    };
  }

  async obtenerResumenEjecutivo(startDate: Date, endDate: Date) {
    const whereClause = {
      creado_en: { gte: startDate, lte: endDate },
      estado: 'COMPLETADA'
    };

    const ventas = await this.prisma.venta.findMany({
      where: whereClause,
      select: { id: true, creado_en: true, total: true, metodo_pago: true }
    });

    const duration = endDate.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - duration);
    const previousEndDate = new Date(endDate.getTime() - duration);
    
    const ventasAnteriores = await this.prisma.venta.findMany({
      where: {
        creado_en: { gte: previousStartDate, lte: previousEndDate },
        estado: 'COMPLETADA'
      },
      select: { total: true }
    });

    const totalIngresos = ventas.reduce((acc, v) => acc + Number(v.total), 0);
    const totalIngresosAnterior = ventasAnteriores.reduce((acc, v) => acc + Number(v.total), 0);
    const ticketPromedio = ventas.length > 0 ? totalIngresos / ventas.length : 0;
    const ticketPromedioAnterior = ventasAnteriores.length > 0 ? totalIngresosAnterior / ventasAnteriores.length : 0;

    const variacionIngresos = totalIngresosAnterior > 0 ? ((totalIngresos - totalIngresosAnterior) / totalIngresosAnterior) * 100 : (totalIngresos > 0 ? 100 : 0);
    const variacionTicket = ticketPromedioAnterior > 0 ? ((ticketPromedio - ticketPromedioAnterior) / ticketPromedioAnterior) * 100 : (ticketPromedio > 0 ? 100 : 0);

    const ventasPorDiaMap = new Map<string, number>();
    const metodosPagoMap = new Map<string, number>();
    const horariosPicoMap = new Map<number, number>();

    for (let i = 0; i < 24; i++) horariosPicoMap.set(i, 0);

    ventas.forEach(v => {
      const diaStr = v.creado_en.toISOString().split('T')[0];
      ventasPorDiaMap.set(diaStr, (ventasPorDiaMap.get(diaStr) || 0) + Number(v.total));

      const metodo = v.metodo_pago;
      metodosPagoMap.set(metodo, (metodosPagoMap.get(metodo) || 0) + Number(v.total));

      const hora = v.creado_en.getHours();
      horariosPicoMap.set(hora, horariosPicoMap.get(hora)! + 1);
    });

    const ventasPorDia = [];
    const iterDate = new Date(startDate);
    while (iterDate <= endDate) {
      const diaStr = iterDate.toISOString().split('T')[0];
      ventasPorDia.push({
        fecha: diaStr,
        total: ventasPorDiaMap.get(diaStr) || 0
      });
      iterDate.setDate(iterDate.getDate() + 1);
    }

    const metodosPago = Array.from(metodosPagoMap.entries()).map(([nombre, total]) => ({ nombre, total }));
    const horariosPico = Array.from(horariosPicoMap.entries()).map(([hora, cantidad]) => ({ hora: `${hora}:00`, cantidad }));

    const detalles = await this.prisma.ventaDetalle.findMany({
      where: { venta: whereClause },
      include: { producto: { include: { categoria: true } } }
    });

    const productosMap = new Map<string, { nombre: string, cantidad: number, total: number }>();
    const categoriasMap = new Map<string, number>();

    detalles.forEach(d => {
      const pName = d.producto.nombre;
      const cName = d.producto.categoria.nombre;
      
      if (!productosMap.has(pName)) productosMap.set(pName, { nombre: pName, cantidad: 0, total: 0 });
      productosMap.get(pName)!.cantidad += d.cantidad;
      productosMap.get(pName)!.total += Number(d.subtotal);

      categoriasMap.set(cName, (categoriasMap.get(cName) || 0) + Number(d.subtotal));
    });

    const topProductos = Array.from(productosMap.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    const ventasPorCategoria = Array.from(categoriasMap.entries()).map(([nombre, total]) => ({ nombre, total }));

    return {
      ventasPorDia,
      ticketPromedio,
      totalIngresos,
      metodosPago,
      variacionIngresos,
      variacionTicket,
      horariosPico,
      topProductos,
      ventasPorCategoria
    };
  }

  async obtenerInventarioCritico(): Promise<any[]> {
    const itemsCriticos = await this.prisma.inventario.findMany({
      where: {
        cantidad_disponible: {
          lte: 5 // Default stock minimo para evitar errores de Prisma comparando columnas
        }
      },
      include: {
        producto: {
          select: { nombre: true, sku: true, activo: true }
        },
        variante: {
          select: { sku_base: true, combinacion_opciones: true }
        }
      },
      orderBy: {
        cantidad_disponible: 'asc'
      }
    });

    return itemsCriticos.map((item: any) => ({
      id: String(item.id),
      sku: item.variante?.sku_base || item.producto.sku,
      nombre: item.producto.nombre,
      variante: item.variante?.combinacion_opciones ? JSON.stringify(item.variante.combinacion_opciones) : null,
      disponible: item.cantidad_disponible,
      minimo: item.stock_minimo,
      ubicacion: item.ubicacion,
      activo: item.producto.activo
    }));
  }

  async obtenerSaludStock(): Promise<{ 
    capitalInmovilizado: number;
    stockCritico: number;
    lentosMovimientos: number;
    valorTotalInventario: number;
    topCapitalInmovilizado: any[];
    topStockCritico: any[];
    topLentosMovimientos: any[];
  }> {
    // 1. Stock Crítico
    const inventarioCritico = await this.prisma.$queryRaw<any[]>`
      SELECT 
        i.id, 
        i.cantidad_disponible, 
        i.stock_minimo, 
        p.nombre as producto_nombre, 
        p.sku,
        COALESCE(
          (SELECT SUM(vd.cantidad) 
           FROM venta_detalles vd 
           JOIN ventas v ON v.id = vd.venta_id 
           WHERE vd.producto_id = p.id AND v.estado = 'COMPLETADA' AND v.creado_en >= CURRENT_DATE - INTERVAL '30 days'), 0
        ) as ventas_30_dias
      FROM inventario i
      JOIN productos p ON p.id = i.producto_id
      WHERE i.cantidad_disponible <= i.stock_minimo
    `;

    const topStockCritico = inventarioCritico
      .sort((a, b) => Number(a.cantidad_disponible) - Number(b.cantidad_disponible))
      .slice(0, 10)
      .map(item => {
        const ventas30Dias = Number(item.ventas_30_dias);
        const ventasDiarias = ventas30Dias / 30;
        const diasCobertura = ventasDiarias > 0 ? Math.round(Number(item.cantidad_disponible) / ventasDiarias) : 0;
        
        return {
          id: String(item.id),
          producto: item.producto_nombre,
          sku: item.sku,
          stock: Number(item.cantidad_disponible),
          minimo: Number(item.stock_minimo),
          ventas30Dias,
          diasCobertura
        };
      });

    // 2. Lento Movimiento (Huesos) y Valor Total
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 60);

    const todosLosInventarios = await this.prisma.inventario.findMany({
      where: { cantidad_disponible: { gt: 0 } },
      include: {
        producto: {
          select: {
            nombre: true,
            sku: true,
            costo_promedio: true,
            VentaDetalle: {
              select: { venta: { select: { creado_en: true } } },
              orderBy: { venta: { creado_en: 'desc' } },
              take: 1
            }
          }
        },
        variante: { select: { nombre: true, sku_base: true, costo_promedio: true } }
      }
    });

    let capitalInmovilizado = 0;
    let valorTotalInventario = 0;
    const listaLentos: any[] = [];

    const hoy = new Date();

    for (const inv of todosLosInventarios) {
      const costo = inv.variante ? Number(inv.variante.costo_promedio) : Number(inv.producto.costo_promedio);
      const valor = costo * inv.cantidad_disponible;
      valorTotalInventario += valor;

      // Check si es lento movimiento (no hay ventas en los últimos 60 días o nunca tuvo ventas)
      const ultimaVenta = inv.producto.VentaDetalle[0]?.venta?.creado_en;
      
      let diasSinVender: number | string = 'Sin ventas previas';
      if (ultimaVenta) {
        diasSinVender = Math.floor((hoy.getTime() - new Date(ultimaVenta).getTime()) / (1000 * 3600 * 24));
      }

      if (!ultimaVenta || ultimaVenta < fechaLimite) {
        capitalInmovilizado += valor;
        listaLentos.push({
          id: String(inv.id),
          producto: inv.variante ? `${inv.producto.nombre} - ${inv.variante.nombre}` : inv.producto.nombre,
          sku: inv.variante?.sku_base || inv.producto.sku,
          stock: inv.cantidad_disponible,
          valorInmovilizado: valor,
          diasSinVender
        });
      }
    }

    const topLentosMovimientos = [...listaLentos]
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 10);

    const topCapitalInmovilizado = [...listaLentos]
      .sort((a, b) => b.valorInmovilizado - a.valorInmovilizado)
      .slice(0, 10);

    return {
      capitalInmovilizado,
      valorTotalInventario,
      stockCritico: inventarioCritico.length,
      lentosMovimientos: listaLentos.length,
      topCapitalInmovilizado,
      topStockCritico,
      topLentosMovimientos
    };
  }

  async obtenerRendimientoVendedores(startDate: Date, endDate: Date): Promise<any[]> {
    const ventas = await this.prisma.venta.findMany({
      where: {
        creado_en: { gte: startDate, lte: endDate },
        estado: 'COMPLETADA'
      },
      include: {
        usuario: {
          select: { id: true, nombres: true, apellidos: true }
        }
      }
    });

    const rendimientoMap = new Map<string, any>();

    ventas.forEach((venta: any) => {
      const vendedorId = venta.usuario_id ? String(venta.usuario_id) : 'SISTEMA';
      const vendedorNombre = venta.usuario 
        ? `${venta.usuario.nombres} ${venta.usuario.apellidos}`.trim()
        : 'E-commerce / Sistema';

      if (!rendimientoMap.has(vendedorId)) {
        rendimientoMap.set(vendedorId, {
          id: vendedorId,
          nombre: vendedorNombre,
          totalVentas: 0,
          cantidadTickets: 0,
          ticketPromedio: 0
        });
      }

      const stats = rendimientoMap.get(vendedorId);
      stats.totalVentas += Number(venta.total);
      stats.cantidadTickets += 1;
    });

    const resultados = Array.from(rendimientoMap.values()).map(stats => {
      stats.ticketPromedio = stats.totalVentas / stats.cantidadTickets;
      return stats;
    });

    // Ordenar de mayor a menor ventas
    return resultados.sort((a, b) => b.totalVentas - a.totalVentas);
  }
}
