import { GetDashboardMetricsUseCase } from './get-dashboard-metrics.use-case';
import type { IDashboardRepository } from '../../domain/repositories/dashboard.repository.interface';

function createMockRepo(): jest.Mocked<IDashboardRepository> {
  return {
    obtenerVentasHoy: jest.fn().mockResolvedValue({ total: 0, cantidad: 0 }),
    obtenerVentasDesde: jest.fn().mockResolvedValue([]),
    obtenerDistribucionPorMetodoPago: jest.fn().mockResolvedValue([]),
    obtenerAlertasStock: jest.fn().mockResolvedValue([]),
    contarProductosActivos: jest.fn().mockResolvedValue(0),
    sumarStockDisponible: jest.fn().mockResolvedValue(0),
    obtenerVentasRecientes: jest.fn().mockResolvedValue([]),
  };
}

describe('GetDashboardMetricsUseCase', () => {
  let repo: jest.Mocked<IDashboardRepository>;
  let useCase: GetDashboardMetricsUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 7, 5, 12, 0, 0)); // miércoles
    repo = createMockRepo();
    useCase = new GetDashboardMetricsUseCase(repo);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calcula el ticket promedio a partir de las ventas de hoy', async () => {
    repo.obtenerVentasHoy.mockResolvedValue({ total: 300, cantidad: 3 });

    const result = await useCase.execute();

    expect(result.data.ventasHoy).toEqual({ total: 300, cantidad: 3, ticketPromedio: 100 });
  });

  it('el ticket promedio es 0 cuando no hubo ventas hoy (evita división por cero)', async () => {
    repo.obtenerVentasHoy.mockResolvedValue({ total: 0, cantidad: 0 });

    const result = await useCase.execute();

    expect(result.data.ventasHoy.ticketPromedio).toBe(0);
  });

  it('agrupa las ventas de la semana por día, inicializando en 0 los 7 días de la ventana', async () => {
    repo.obtenerVentasDesde.mockResolvedValue([
      { total: 50, creado_en: new Date(2026, 7, 5, 10, 0, 0) }, // miércoles
      { total: 25, creado_en: new Date(2026, 7, 5, 16, 0, 0) }, // miércoles
      { total: 10, creado_en: new Date(2026, 7, 3, 9, 0, 0) }, // lunes
    ]);

    const result = await useCase.execute();

    expect(result.data.graficoSemanal).toHaveLength(7);
    expect(result.data.graficoSemanal.find((d) => d.dia === 'Mié')?.total).toBe(75);
    expect(result.data.graficoSemanal.find((d) => d.dia === 'Lun')?.total).toBe(10);
    expect(result.data.graficoSemanal.find((d) => d.dia === 'Dom')?.total).toBe(0);
  });

  it('reconcilia la distribución por método de pago: fija EFECTIVO/QR/TARJETA en 0 y calcula el porcentaje', async () => {
    repo.obtenerDistribucionPorMetodoPago.mockResolvedValue([
      { metodo: 'EFECTIVO', monto: 60 },
      { metodo: 'QR', monto: 40 },
    ]);

    const result = await useCase.execute();

    const porMetodo = Object.fromEntries(result.data.distribucionPagos.map((d) => [d.metodo, d]));
    expect(porMetodo.EFECTIVO).toEqual({ metodo: 'EFECTIVO', monto: 60, porcentaje: 60 });
    expect(porMetodo.QR).toEqual({ metodo: 'QR', monto: 40, porcentaje: 40 });
    expect(porMetodo.TARJETA).toEqual({ metodo: 'TARJETA', monto: 0, porcentaje: 0 });
    expect(porMetodo.OTRO).toEqual({ metodo: 'OTRO', monto: 0, porcentaje: 0 });
  });

  it('desvía métodos de pago desconocidos al bucket OTRO', async () => {
    repo.obtenerDistribucionPorMetodoPago.mockResolvedValue([{ metodo: 'CRIPTO', monto: 100 }]);

    const result = await useCase.execute();

    const porMetodo = Object.fromEntries(result.data.distribucionPagos.map((d) => [d.metodo, d]));
    expect(porMetodo.OTRO.monto).toBe(100);
    expect(porMetodo.OTRO.porcentaje).toBe(100);
  });

  it('itemsCriticos refleja la cantidad de alertas de stock devueltas, no una segunda consulta', async () => {
    repo.obtenerAlertasStock.mockResolvedValue([
      { id: '1', nombre: 'A', sku: 'A1', stock: 2, stockMinimo: 5 },
      { id: '2', nombre: 'B', sku: 'B1', stock: 1, stockMinimo: 5 },
    ]);

    const result = await useCase.execute();

    expect(result.data.resumenInventario.itemsCriticos).toBe(2);
    expect(result.data.alertasStock).toHaveLength(2);
  });

  it('usa "Cliente General" cuando la venta reciente no tiene cliente asociado', async () => {
    repo.obtenerVentasRecientes.mockResolvedValue([
      { id: '1', ticket: 'T-1', total: 50, metodoPago: 'EFECTIVO', fecha: new Date(), clienteNombre: null },
      { id: '2', ticket: 'T-2', total: 80, metodoPago: 'QR', fecha: new Date(), clienteNombre: 'Ana Pérez' },
    ]);

    const result = await useCase.execute();

    expect(result.data.ventasRecientes[0].cliente).toBe('Cliente General');
    expect(result.data.ventasRecientes[1].cliente).toBe('Ana Pérez');
  });

  it('pide todas las métricas en paralelo (no encadena requests innecesariamente)', async () => {
    await useCase.execute();

    expect(repo.obtenerVentasHoy).toHaveBeenCalledTimes(1);
    expect(repo.obtenerVentasDesde).toHaveBeenCalledTimes(1);
    expect(repo.obtenerDistribucionPorMetodoPago).toHaveBeenCalledTimes(1);
    expect(repo.obtenerAlertasStock).toHaveBeenCalledWith(10, 5);
    expect(repo.obtenerVentasRecientes).toHaveBeenCalledWith(6);
  });
});
