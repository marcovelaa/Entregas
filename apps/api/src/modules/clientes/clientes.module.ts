import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { ClientesController } from './infrastructure/controllers/clientes.controller';
import { CLIENTE_REPOSITORY } from './domain/repositories/cliente.repository.interface';
import { PrismaClienteRepository } from './infrastructure/repositories/prisma-cliente.repository';
import { CrearClienteUseCase } from './application/use-cases/crear-cliente.use-case';
import { ListarClientesUseCase } from './application/use-cases/listar-clientes.use-case';
import { ActualizarClienteUseCase } from './application/use-cases/actualizar-cliente.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [ClientesController],
  providers: [
    {
      provide: CLIENTE_REPOSITORY,
      useClass: PrismaClienteRepository
    },
    {
      provide: CrearClienteUseCase,
      useFactory: (repo) => new CrearClienteUseCase(repo),
      inject: [CLIENTE_REPOSITORY]
    },
    {
      provide: ListarClientesUseCase,
      useFactory: (repo) => new ListarClientesUseCase(repo),
      inject: [CLIENTE_REPOSITORY]
    },
    {
      provide: ActualizarClienteUseCase,
      useFactory: (repo) => new ActualizarClienteUseCase(repo),
      inject: [CLIENTE_REPOSITORY]
    }
  ],
  exports: [CLIENTE_REPOSITORY]
})
export class ClientesModule {}
