import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ProveedoresController } from './infrastructure/controllers/proveedores.controller';
import { PrismaProveedorRepository } from './infrastructure/repositories/prisma-proveedor.repository';
import { PROVEEDOR_REPOSITORY } from './domain/repositories/proveedor.repository.interface';

// Use cases
import { CrearProveedorUseCase } from './application/use-cases/crear-proveedor.use-case';
import { ListarProveedoresUseCase } from './application/use-cases/listar-proveedores.use-case';
import { ActualizarProveedorUseCase } from './application/use-cases/actualizar-proveedor.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [ProveedoresController],
  providers: [
    {
      provide: PROVEEDOR_REPOSITORY,
      useClass: PrismaProveedorRepository,
    },
    {
      provide: CrearProveedorUseCase,
      useFactory: (repo) => new CrearProveedorUseCase(repo),
      inject: [PROVEEDOR_REPOSITORY],
    },
    {
      provide: ListarProveedoresUseCase,
      useFactory: (repo) => new ListarProveedoresUseCase(repo),
      inject: [PROVEEDOR_REPOSITORY],
    },
    {
      provide: ActualizarProveedorUseCase,
      useFactory: (repo) => new ActualizarProveedorUseCase(repo),
      inject: [PROVEEDOR_REPOSITORY],
    },
  ],
  exports: [PROVEEDOR_REPOSITORY],
})
export class ProveedoresModule {}
