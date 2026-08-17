import { Module } from '@nestjs/common';
import { ReportesController } from './infrastructure/controllers/reportes.controller';
import { GetReporteVentasUseCase } from './application/use-cases/get-reporte-ventas.use-case';
import { GetResumenEjecutivoUseCase } from './application/use-cases/get-resumen-ejecutivo.use-case';
import { GetInventarioCriticoUseCase } from './application/use-cases/get-inventario-critico.use-case';
import { GetRendimientoVendedoresUseCase } from './application/use-cases/get-rendimiento-vendedores.use-case';
import { GetSaludStockUseCase } from './application/use-cases/get-salud-stock.use-case';
import { GetAprobadoresUseCase } from './application/use-cases/get-aprobadores.use-case';
import { GetDetalleTicketUseCase } from './application/use-cases/get-detalle-ticket.use-case';
import { REPORTES_REPOSITORY } from './domain/repositories/reportes.repository.interface';
import { PrismaReportesRepository } from './infrastructure/repositories/prisma-reportes.repository';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportesController],
  providers: [
    GetReporteVentasUseCase,
    GetResumenEjecutivoUseCase,
    GetInventarioCriticoUseCase,
    GetRendimientoVendedoresUseCase,
    GetSaludStockUseCase,
    GetAprobadoresUseCase,
    GetDetalleTicketUseCase,
    {
      provide: REPORTES_REPOSITORY,
      useClass: PrismaReportesRepository
    }
  ]
})
export class ReportesModule {}
