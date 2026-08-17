import { GetReporteVentasDto } from '../../infrastructure/dto/get-reporte-ventas.dto';

export const REPORTES_REPOSITORY = 'REPORTES_REPOSITORY';

export interface IReportesRepository {
  obtenerReporteVentas(filtros: GetReporteVentasDto): Promise<{
    data: any[];
    meta: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      limit: number;
      totalMonto: number;
    };
  }>;

  obtenerResumenEjecutivo(startDate: Date, endDate: Date): Promise<{
    ventasPorDia: { fecha: string; total: number }[];
    ticketPromedio: number;
    totalIngresos: number;
    metodosPago: { nombre: string; total: number }[];
  }>;

  obtenerInventarioCritico(): Promise<any[]>;

  obtenerSaludStock(): Promise<{ 
    capitalInmovilizado: number;
    stockCritico: number;
    lentosMovimientos: number;
    valorTotalInventario: number;
    topCapitalInmovilizado: any[];
    topStockCritico: any[];
    topLentosMovimientos: any[];
  }>;

  obtenerRendimientoVendedores(startDate: Date, endDate: Date): Promise<any[]>;
}
