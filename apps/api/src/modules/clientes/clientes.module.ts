import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { ClientePerfilController } from './infrastructure/controllers/cliente-perfil.controller';
import { DireccionesController } from './infrastructure/controllers/direcciones.controller';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository.interface';
import { PrismaClienteRepository } from './infrastructure/repositories/prisma-cliente.repository';
import { DIRECCION_REPOSITORY } from './domain/repositories/direccion.repository.interface';
import { PrismaDireccionRepository } from './infrastructure/repositories/prisma-direccion.repository';
import { CrearClienteUseCase } from './application/use-cases/crear-cliente.use-case';
import { ListarClientesUseCase } from './application/use-cases/listar-clientes.use-case';
import { ActualizarClienteUseCase } from './application/use-cases/actualizar-cliente.use-case';
import { ListarDireccionesUseCase } from './application/use-cases/direcciones/listar-direcciones.use-case';
import { CrearDireccionUseCase } from './application/use-cases/direcciones/crear-direccion.use-case';
import { ActualizarDireccionUseCase } from './application/use-cases/direcciones/actualizar-direccion.use-case';
import { EliminarDireccionUseCase } from './application/use-cases/direcciones/eliminar-direccion.use-case';
import { MarcarDireccionPrincipalUseCase } from './application/use-cases/direcciones/marcar-direccion-principal.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [
    ClientesController,
    ClientePerfilController,
    DireccionesController,
  ],
  providers: [
    { provide: CLIENTE_REPOSITORY, useClass: PrismaClienteRepository },
    { provide: DIRECCION_REPOSITORY, useClass: PrismaDireccionRepository },
    {
      provide: CrearClienteUseCase,
      useFactory: (repo) => new CrearClienteUseCase(repo),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: ListarClientesUseCase,
      useFactory: (repo) => new ListarClientesUseCase(repo),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: ActualizarClienteUseCase,
      useFactory: (repo) => new ActualizarClienteUseCase(repo),
      inject: [CLIENTE_REPOSITORY],
    },
    {
      provide: ListarDireccionesUseCase,
      useFactory: (repo) => new ListarDireccionesUseCase(repo),
      inject: [DIRECCION_REPOSITORY],
    },
    {
      provide: CrearDireccionUseCase,
      useFactory: (repo) => new CrearDireccionUseCase(repo),
      inject: [DIRECCION_REPOSITORY],
    },
    {
      provide: ActualizarDireccionUseCase,
      useFactory: (repo) => new ActualizarDireccionUseCase(repo),
      inject: [DIRECCION_REPOSITORY],
    },
    {
      provide: EliminarDireccionUseCase,
      useFactory: (repo) => new EliminarDireccionUseCase(repo),
      inject: [DIRECCION_REPOSITORY],
    },
    {
      provide: MarcarDireccionPrincipalUseCase,
      useFactory: (repo) => new MarcarDireccionPrincipalUseCase(repo),
      inject: [DIRECCION_REPOSITORY],
    },
  ],
  exports: [CLIENTE_REPOSITORY],
})
export class ClientesModule {}
