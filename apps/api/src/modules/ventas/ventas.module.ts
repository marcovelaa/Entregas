import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DescuentosModule } from '../descuentos/descuentos.module';
import { VentasController } from './infrastructure/controllers/ventas.controller';
import { VENTA_REPOSITORY } from './domain/repositories/venta.repository.interface';
import { PrismaVentaRepository } from './infrastructure/repositories/prisma-venta.repository';
import { RegistrarVentaUseCase } from './application/use-cases/registrar-venta.use-case';
import { ListarVentasUseCase } from './application/use-cases/listar-ventas.use-case';
import { AnularVentaUseCase } from './application/use-cases/anular-venta.use-case';
import { RevertirAnulacionVentaUseCase } from './application/use-cases/revertir-anulacion-venta.use-case';

@Module({
  imports: [PrismaModule, DescuentosModule],
  controllers: [VentasController],
  providers: [
    {
      provide: VENTA_REPOSITORY,
      useClass: PrismaVentaRepository
    },
    {
      provide: RegistrarVentaUseCase,
      useFactory: (repo) => new RegistrarVentaUseCase(repo),
      inject: [VENTA_REPOSITORY]
    },
    {
      provide: ListarVentasUseCase,
      useFactory: (repo) => new ListarVentasUseCase(repo),
      inject: [VENTA_REPOSITORY]
    },
    {
      provide: AnularVentaUseCase,
      useFactory: (repo) => new AnularVentaUseCase(repo),
      inject: [VENTA_REPOSITORY]
    },
    {
      provide: RevertirAnulacionVentaUseCase,
      useFactory: (repo) => new RevertirAnulacionVentaUseCase(repo),
      inject: [VENTA_REPOSITORY]
    }
  ],
  exports: [VENTA_REPOSITORY]
})
export class VentasModule {}
