import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ComprasController } from './infrastructure/controllers/compras.controller';
import { COMPRA_REPOSITORY } from './domain/repositories/compra.repository.interface';
import { PrismaCompraRepository } from './infrastructure/repositories/prisma-compra.repository';
import { RegistrarCompraUseCase } from './application/use-cases/registrar-compra.use-case';
import { ListarComprasUseCase } from './application/use-cases/listar-compras.use-case';
import { ObtenerCompraUseCase } from './application/use-cases/obtener-compra.use-case';
import { InventarioModule } from '../inventario/inventario.module';
import { INVENTARIO_REPOSITORY } from '../inventario/domain/repositories/inventario.repository.interface';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { PRODUCTO_REPOSITORY } from '../catalogo/domain/repositories/producto.repository.interface';
import { VARIANTE_REPOSITORY } from '../catalogo/domain/repositories/variante.repository.interface';

@Module({
  imports: [PrismaModule, InventarioModule, CatalogoModule],
  controllers: [ComprasController],
  providers: [
    {
      provide: COMPRA_REPOSITORY,
      useClass: PrismaCompraRepository,
    },
    {
      provide: RegistrarCompraUseCase,
      useFactory: (compraRepo, inventarioRepo, productoRepo, varianteRepo, prisma) =>
        new RegistrarCompraUseCase(compraRepo, inventarioRepo, productoRepo, varianteRepo, prisma),
      inject: [COMPRA_REPOSITORY, INVENTARIO_REPOSITORY, PRODUCTO_REPOSITORY, VARIANTE_REPOSITORY, PrismaService],
    },
    {
      provide: ListarComprasUseCase,
      useFactory: (compraRepo) => new ListarComprasUseCase(compraRepo),
      inject: [COMPRA_REPOSITORY],
    },
    {
      provide: ObtenerCompraUseCase,
      useFactory: (compraRepo) => new ObtenerCompraUseCase(compraRepo),
      inject: [COMPRA_REPOSITORY],
    },
  ],
})
export class ComprasModule {}
