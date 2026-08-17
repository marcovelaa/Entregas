import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { ICajaRepository, CajaData, MovimientoCajaData } from '../../domain/repositories/caja.repository.interface';

@Injectable()
export class PrismaCajaRepository implements ICajaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerCajaActiva(): Promise<CajaData | null> {
    const caja = await this.prisma.caja.findFirst({
      where: { estado: 'ABIERTA' },
      orderBy: { fecha_apertura: 'desc' }
    });
    if (!caja) return null;
    return this.serializeCaja(caja);
  }

  async abrirCaja(usuario_id: string, monto_apertura: number): Promise<CajaData> {
    const caja = await this.prisma.caja.create({
      data: {
        usuario_id: BigInt(usuario_id),
        monto_apertura: monto_apertura,
        estado: 'ABIERTA'
      }
    });
    return this.serializeCaja(caja);
  }

  async cerrarCaja(caja_id: string, monto_cierre_esp: number, monto_cierre_real: number, diferencia: number, observaciones?: string): Promise<CajaData> {
    const caja = await this.prisma.caja.update({
      where: { id: BigInt(caja_id) },
      data: {
        estado: 'CERRADA',
        fecha_cierre: new Date(),
        monto_cierre_esp,
        monto_cierre_real,
        diferencia,
        observaciones
      }
    });
    return this.serializeCaja(caja);
  }

  async registrarMovimiento(params: {
    caja_id: string;
    usuario_id: string;
    tipo_movimiento: 'INGRESO' | 'EGRESO';
    concepto: string;
    monto: number;
    metodo_pago: string;
    referencia_id?: string;
  }): Promise<MovimientoCajaData> {
    const mov = await this.prisma.movimientoCaja.create({
      data: {
        caja_id: BigInt(params.caja_id),
        usuario_id: BigInt(params.usuario_id),
        tipo_movimiento: params.tipo_movimiento,
        concepto: params.concepto,
        monto: params.monto,
        metodo_pago: params.metodo_pago,
        referencia_id: params.referencia_id
      }
    });
    return this.serializeMovimiento(mov);
  }

  async calcularEfectivoEsperado(caja_id: string): Promise<number> {
    const cajaData = await this.prisma.caja.findUnique({
      where: { id: BigInt(caja_id) },
      select: { monto_apertura: true }
    });
    const montoBase = cajaData ? Number(cajaData.monto_apertura) : 0;

    const movimientos = await this.prisma.movimientoCaja.findMany({
      where: { 
        caja_id: BigInt(caja_id),
        metodo_pago: 'EFECTIVO' // Solo nos importa el efectivo para el arqueo de caja física
      }
    });

    const ingresos = movimientos.filter(m => m.tipo_movimiento === 'INGRESO').reduce((acc, m) => acc + Number(m.monto), 0);
    const egresos = movimientos.filter(m => m.tipo_movimiento === 'EGRESO').reduce((acc, m) => acc + Number(m.monto), 0);

    return montoBase + ingresos - egresos;
  }

  async obtenerMovimientos(caja_id: string): Promise<MovimientoCajaData[]> {
    const movs = await this.prisma.movimientoCaja.findMany({
      where: { caja_id: BigInt(caja_id) },
      orderBy: { creado_en: 'desc' }
    });
    return movs.map(m => this.serializeMovimiento(m));
  }

  private serializeCaja(caja: any): CajaData {
    return {
      id: caja.id.toString(),
      usuario_id: caja.usuario_id.toString(),
      fecha_apertura: caja.fecha_apertura,
      fecha_cierre: caja.fecha_cierre,
      monto_apertura: Number(caja.monto_apertura),
      monto_cierre_esp: caja.monto_cierre_esp ? Number(caja.monto_cierre_esp) : null,
      monto_cierre_real: caja.monto_cierre_real ? Number(caja.monto_cierre_real) : null,
      diferencia: caja.diferencia ? Number(caja.diferencia) : null,
      estado: caja.estado,
      observaciones: caja.observaciones
    };
  }

  private serializeMovimiento(mov: any): MovimientoCajaData {
    return {
      id: mov.id.toString(),
      caja_id: mov.caja_id.toString(),
      usuario_id: mov.usuario_id.toString(),
      tipo_movimiento: mov.tipo_movimiento,
      concepto: mov.concepto,
      monto: Number(mov.monto),
      metodo_pago: mov.metodo_pago,
      creado_en: mov.creado_en
    };
  }
}
