import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../common/prisma/prisma.service';

export interface ComponenteAnalitica {
  id: string;
  nombre: string;
  sku: string;
  cantidadEnCombo: number;
  precioIndividual: number;
  subtotalIndividual: number;
  stockDisponible: number;
  kitsPosibles: number;
  esCuelloDeBotella: boolean;
}

export interface ComboAnaliticaResult {
  comboId: string;
  nombre: string;
  sku: string;
  canal: string;
  activo: boolean;
  precioCombo: number;
  precioSumaComponentes: number;
  ahorroPorKitBs: number;
  porcentajeAhorro: number;
  unidadesVendidas: number;
  totalRecaudadoBs: number;
  ahorroTotalClientesBs: number;
  cupoMaximo: number | null;
  cupoUsado: number;
  cupoPorcentaje: number | null;
  stockVirtualActual: number;
  componentes: ComponenteAnalitica[];
  desglosePagos: Array<{ metodo: string; cantidad: number; totalBs: number }>;
  historialDiario: Array<{ fecha: string; unidades: number; totalBs: number }>;
  ultimasVentas: Array<{
    id: string;
    ticket: string;
    fecha: string;
    cliente: string;
    cantidad: number;
    total: number;
    metodoPago: string;
  }>;
}

@Injectable()
export class ObtenerAnaliticaComboUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: bigint): Promise<ComboAnaliticaResult> {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        marca: true,
        componentes_combo: {
          include: {
            componente_producto: {
              include: {
                Inventario: true,
              },
            },
            variante: {
              include: {
                Inventario: true,
              },
            },
            empaque: true,
          },
        },
      },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    if (producto.tipo_producto !== 'COMBO') {
      throw new NotFoundException(`El producto "${producto.nombre}" no es de tipo COMBO`);
    }

    // 1. Fetch sales details of this combo
    const ventasDetalles = await this.prisma.ventaDetalle.findMany({
      where: {
        producto_id: id,
        venta: {
          estado: 'COMPLETADA',
        },
      },
      include: {
        venta: {
          include: {
            cliente: true,
          },
        },
      },
      orderBy: {
        venta: {
          creado_en: 'desc',
        },
      },
    });

    // 2. Aggregate sales metrics
    let unidadesVendidas = 0;
    let totalRecaudadoBs = 0;
    const dailyMap = new Map<string, { fecha: string; unidades: number; totalBs: number }>();
    const pagosMap = new Map<string, { metodo: string; cantidad: number; totalBs: number }>();

    ventasDetalles.forEach((vd: any) => {
      const cant = vd.cantidad;
      const subtotal = Number(vd.subtotal);
      unidadesVendidas += cant;
      totalRecaudadoBs += subtotal;

      // Daily timeline
      const fechaIso = vd.venta.creado_en.toISOString().split('T')[0];
      const dayData = dailyMap.get(fechaIso) || { fecha: fechaIso, unidades: 0, totalBs: 0 };
      dayData.unidades += cant;
      dayData.totalBs += subtotal;
      dailyMap.set(fechaIso, dayData);

      // Payment method breakdown
      const metodo = vd.venta.metodo_pago || 'EFECTIVO';
      const pagoData = pagosMap.get(metodo) || { metodo, cantidad: 0, totalBs: 0 };
      pagoData.cantidad += cant;
      pagoData.totalBs += subtotal;
      pagosMap.set(metodo, pagoData);
    });

    // Fallback: if cupo_usado > unidadesVendidas from historical records, use cupo_usado
    if (producto.cupo_usado > unidadesVendidas) {
      unidadesVendidas = producto.cupo_usado;
    }

    // 3. Calculate components breakdown, BOM stock and Bottleneck
    let precioSumaComponentes = 0;
    let minKitsPosibles = Infinity;

    const rawComponents = producto.componentes_combo.map((c: any) => {
      const pComp = c.componente_producto;
      const pVar = c.variante;
      const cantReq = c.cantidad || 1;
      const precioUnit = Number(pComp.precio_base);
      const subtotalInd = precioUnit * cantReq;
      precioSumaComponentes += subtotalInd;

      // Calculate available physical stock for this component
      let stockDisp = 0;
      if (pVar && pVar.Inventario?.length) {
        stockDisp = pVar.Inventario.reduce((acc: number, inv: any) => acc + (inv.cantidad_disponible - inv.reservado), 0);
      } else if (pComp.Inventario?.length) {
        stockDisp = pComp.Inventario.reduce((acc: number, inv: any) => acc + (inv.cantidad_disponible - inv.reservado), 0);
      }
      stockDisp = Math.max(0, stockDisp);

      const kitsPosibles = cantReq > 0 ? Math.floor(stockDisp / cantReq) : 0;
      if (kitsPosibles < minKitsPosibles) {
        minKitsPosibles = kitsPosibles;
      }

      return {
        id: pComp.id.toString(),
        nombre: pComp.nombre,
        sku: pComp.sku,
        cantidadEnCombo: cantReq,
        precioIndividual: precioUnit,
        subtotalIndividual: subtotalInd,
        stockDisponible: stockDisp,
        kitsPosibles,
      };
    });

    const stockVirtualActual = minKitsPosibles === Infinity ? 0 : minKitsPosibles;

    const componentes: ComponenteAnalitica[] = rawComponents.map((c: any) => ({
      ...c,
      esCuelloDeBotella: c.kitsPosibles === stockVirtualActual,
    }));

    // 4. Financial & Savings calculations
    const precioCombo = Number(producto.precio_base);
    const ahorroPorKitBs = Math.max(0, precioSumaComponentes - precioCombo);
    const porcentajeAhorro = precioSumaComponentes > 0 ? (ahorroPorKitBs / precioSumaComponentes) * 100 : 0;
    const ahorroTotalClientesBs = unidadesVendidas * ahorroPorKitBs;

    const cupoMaximo = producto.cupo_maximo;
    const cupoUsado = producto.cupo_usado;
    const cupoPorcentaje = cupoMaximo && cupoMaximo > 0 ? Math.min(100, Math.round((cupoUsado / cupoMaximo) * 100)) : null;

    const historialDiario = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    const desglosePagos = Array.from(pagosMap.values()).sort((a, b) => b.totalBs - a.totalBs);

    const ultimasVentas = ventasDetalles.slice(0, 10).map((vd: any) => {
      const clienteNombre = vd.venta?.cliente
        ? `${vd.venta.cliente.nombres} ${vd.venta.cliente.apellidos}`.trim()
        : 'Cliente General';
      return {
        id: vd.id.toString(),
        ticket: vd.venta?.numero_ticket || `#${vd.venta_id}`,
        fecha: vd.venta?.creado_en ? vd.venta.creado_en.toISOString() : new Date().toISOString(),
        cliente: clienteNombre,
        cantidad: vd.cantidad,
        total: Number(vd.subtotal),
        metodoPago: vd.venta?.metodo_pago || 'EFECTIVO',
      };
    });

    return {
      comboId: producto.id.toString(),
      nombre: producto.nombre,
      sku: producto.sku,
      canal: (producto as any).canal_venta || 'AMBOS',
      activo: producto.activo,
      precioCombo,
      precioSumaComponentes,
      ahorroPorKitBs,
      porcentajeAhorro,
      unidadesVendidas,
      totalRecaudadoBs,
      ahorroTotalClientesBs,
      cupoMaximo,
      cupoUsado,
      cupoPorcentaje,
      stockVirtualActual,
      componentes,
      desglosePagos,
      historialDiario,
      ultimasVentas,
    };
  }
}
