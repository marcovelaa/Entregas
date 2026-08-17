import { Controller, Get, Query, Param } from '@nestjs/common';
import { GetReporteVentasUseCase } from '../../application/use-cases/get-reporte-ventas.use-case';
import { GetResumenEjecutivoUseCase } from '../../application/use-cases/get-resumen-ejecutivo.use-case';
import { GetInventarioCriticoUseCase } from '../../application/use-cases/get-inventario-critico.use-case';
import { GetRendimientoVendedoresUseCase } from '../../application/use-cases/get-rendimiento-vendedores.use-case';
import { GetSaludStockUseCase } from '../../application/use-cases/get-salud-stock.use-case';
import { GetAprobadoresUseCase } from '../../application/use-cases/get-aprobadores.use-case';
import { GetDetalleTicketUseCase } from '../../application/use-cases/get-detalle-ticket.use-case';
import { GetReporteVentasDto } from '../dto/get-reporte-ventas.dto';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly getReporteVentasUseCase: GetReporteVentasUseCase,
    private readonly getResumenEjecutivoUseCase: GetResumenEjecutivoUseCase,
    private readonly getInventarioCriticoUseCase: GetInventarioCriticoUseCase,
    private readonly getRendimientoVendedoresUseCase: GetRendimientoVendedoresUseCase,
    private readonly getSaludStockUseCase: GetSaludStockUseCase,
    private readonly getAprobadoresUseCase: GetAprobadoresUseCase,
    private readonly getDetalleTicketUseCase: GetDetalleTicketUseCase
  ) {}

  @Get('aprobadores')
  @RequierePermiso('reportes:ver')
  async getAprobadores() {
    return this.getAprobadoresUseCase.execute();
  }

  @Get('resumen')
  @RequierePermiso('reportes:ver')
  async getResumen() {
    return this.getResumenEjecutivoUseCase.execute();
  }

  @Get('inventario-critico')
  @RequierePermiso('reportes:ver')
  async getInventarioCritico() {
    return this.getInventarioCriticoUseCase.execute();
  }

  @Get('salud-stock')
  @RequierePermiso('reportes:ver')
  async getSaludStock() {
    return this.getSaludStockUseCase.execute();
  }

  @Get('vendedores')
  @RequierePermiso('reportes:ver')
  async getRendimientoVendedores(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.getRendimientoVendedoresUseCase.execute(startDate, endDate);
  }

  @Get('ventas')
  @RequierePermiso('reportes:ver')
  async getReporteVentas(@Query() query: GetReporteVentasDto) {
    return this.getReporteVentasUseCase.execute(query);
  }

  @Get('ventas/:numeroTicket')
  @RequierePermiso('reportes:ver')
  async getDetalleTicket(@Param('numeroTicket') numeroTicket: string) {
    return this.getDetalleTicketUseCase.execute(numeroTicket);
  }
}
