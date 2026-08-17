import { BadRequestException } from '@nestjs/common';
import { RegistrarVentaDto } from '../dtos/venta.dto';
import {
  type IVentaRepository,
  type VentaCreateData,
} from '../../domain/repositories/venta.repository.interface';
import {
  type CajaData,
  type ICajaRepository,
  type MovimientoCajaData,
} from '../../../caja/domain/repositories/caja.repository.interface';
import { RegistrarVentaUseCase } from './registrar-venta.use-case';

const dto: RegistrarVentaDto = {
  idempotency_key: 'registrar-venta-use-case-key',
  metodo_pago: 'EFECTIVO',
  monto_pagado: 10,
  detalles: [{ producto_id: '100', cantidad: 1, precio_unitario: 10 }],
};

const activeCaja: CajaData = {
  id: '7',
  usuario_id: '42',
  fecha_apertura: new Date('2026-08-17T00:00:00.000Z'),
  monto_apertura: 0,
  estado: 'ABIERTA',
};

function createVentaRepository(): IVentaRepository {
  return {
    crear: jest.fn().mockResolvedValue({ id: '1' }),
    listar: jest.fn().mockResolvedValue({ total: 0, data: [] }),
    anular: jest.fn(),
    revertirAnulacion: jest.fn(),
  };
}

function createCajaRepository(caja: CajaData | null): ICajaRepository {
  const movimiento: MovimientoCajaData = {
    id: '1',
    caja_id: '7',
    usuario_id: '42',
    tipo_movimiento: 'INGRESO',
    concepto: 'test',
    monto: 0,
    metodo_pago: 'EFECTIVO',
    creado_en: new Date('2026-08-17T00:00:00.000Z'),
  };

  return {
    obtenerCajaActiva: jest.fn().mockResolvedValue(caja),
    abrirCaja: jest.fn(),
    cerrarCaja: jest.fn(),
    registrarMovimiento: jest.fn().mockResolvedValue(movimiento),
    calcularEfectivoEsperado: jest.fn().mockResolvedValue(0),
    obtenerMovimientos: jest.fn().mockResolvedValue([]),
  };
}

describe('RegistrarVentaUseCase', () => {
  it('vincula cada venta POS a la caja abierta actual', async () => {
    const ventaRepo = createVentaRepository();
    const cajaRepo = createCajaRepository(activeCaja);
    const useCase = new RegistrarVentaUseCase(ventaRepo, cajaRepo);

    await useCase.execute(dto, '42');

    expect(ventaRepo.crear).toHaveBeenCalledWith(
      expect.objectContaining<VentaCreateData>({
        usuario_id: '42',
        caja_id: activeCaja.id,
      }),
    );
  });

  it('rechaza ventas POS cuando no existe una caja abierta', async () => {
    const ventaRepo = createVentaRepository();
    const cajaRepo = createCajaRepository(null);
    const useCase = new RegistrarVentaUseCase(ventaRepo, cajaRepo);

    await expect(useCase.execute(dto, '42')).rejects.toThrow(
      new BadRequestException(
        'No hay una caja abierta para registrar ventas POS.',
      ),
    );
    expect(ventaRepo.crear).not.toHaveBeenCalled();
  });
});
