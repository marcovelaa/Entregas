import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ComprasController } from './infrastructure/controllers/compras.controller';
import { COMPRA_REPOSITORY } from './domain/repositories/compra.repository.interface';
import { PrismaCompraRepository } from './infrastructure/repositories/prisma-compra.repository';
import { RegistrarCompraUseCase } from './application/use-cases/registrar-compra.use-case';
import { RecibirCompraUseCase } from './application/use-cases/recibir-compra.use-case';
import { ActualizarEstadoCompraUseCase } from './application/use-cases/actualizar-estado-compra.use-case';
import { AnularCompraUseCase } from './application/use-cases/anular-compra.use-case';
import { ListarComprasUseCase } from './application/use-cases/listar-compras.use-case';
import { ObtenerCompraUseCase } from './application/use-cases/obtener-compra.use-case';
import { InventarioModule } from '../inventario/inventario.module';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { BitacoraModule } from '../bitacora/bitacora.module';

@Module({
  imports: [PrismaModule, InventarioModule, CatalogoModule, BitacoraModule],
  controllers: [ComprasController],
  providers: [
    {
      provide: COMPRA_REPOSITORY,
      useClass: PrismaCompraRepository,
    },
    RegistrarCompraUseCase,
    RecibirCompraUseCase,
    ActualizarEstadoCompraUseCase,
    AnularCompraUseCase,
    ListarComprasUseCase,
    ObtenerCompraUseCase,
  ],
  exports: [
    COMPRA_REPOSITORY,
    RegistrarCompraUseCase,
    RecibirCompraUseCase,
    ActualizarEstadoCompraUseCase,
    AnularCompraUseCase,
    ListarComprasUseCase,
    ObtenerCompraUseCase,
  ],
})
export class ComprasModule {}
