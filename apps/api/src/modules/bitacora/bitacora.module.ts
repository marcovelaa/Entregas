import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { BITACORA_REPOSITORY } from './domain/repositories/bitacora.repository.interface';
import { PrismaBitacoraRepository } from './infrastructure/repositories/prisma-bitacora.repository';
import { BitacoraService } from './application/services/bitacora.service';
import { ListarBitacoraErpUseCase } from './application/use-cases/listar-bitacora-erp.use-case';
import { BitacoraErpController } from './infrastructure/controllers/bitacora-erp.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BitacoraErpController],
  providers: [
    {
      provide: BITACORA_REPOSITORY,
      useClass: PrismaBitacoraRepository,
    },
    BitacoraService,
    ListarBitacoraErpUseCase,
  ],
  exports: [BITACORA_REPOSITORY, BitacoraService, ListarBitacoraErpUseCase],
})
export class BitacoraModule {}
