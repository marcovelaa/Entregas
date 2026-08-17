import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CajaController } from './caja.controller';
import { CAJA_REPOSITORY } from './domain/repositories/caja.repository.interface';
import { PrismaCajaRepository } from './infrastructure/repositories/prisma-caja.repository';
import { AbrirCajaUseCase } from './application/use-cases/abrir-caja.use-case';
import { CerrarCajaUseCase } from './application/use-cases/cerrar-caja.use-case';
import { ObtenerCajaActivaUseCase } from './application/use-cases/obtener-caja-activa.use-case';
import { RegistrarMovimientoUseCase } from './application/use-cases/registrar-movimiento.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [CajaController],
  providers: [
    {
      provide: CAJA_REPOSITORY,
      useClass: PrismaCajaRepository,
    },
    AbrirCajaUseCase,
    CerrarCajaUseCase,
    ObtenerCajaActivaUseCase,
    RegistrarMovimientoUseCase,
  ],
  exports: [CAJA_REPOSITORY]
})
export class CajaModule {}
