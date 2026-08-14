import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClientesModule } from '../clientes.module';
import { ClienteAuthController } from './cliente-auth.controller';
import { ClienteAuthService } from './cliente-auth.service';
import { ClienteJwtStrategy } from './strategies/cliente-jwt.strategy';
import { ClienteJwtAuthGuard } from './guards/cliente-jwt-auth.guard';
import { getCustomerJwtSecret } from './jwt-cliente.config';
import { CLIENTE_RESET_TOKEN_REPOSITORY } from '../domain/repositories/cliente-reset-token.repository.interface';
import { PrismaClienteResetTokenRepository } from '../infrastructure/repositories/prisma-cliente-reset-token.repository';

@Module({
  imports: [
    ClientesModule,
    PassportModule.register({ defaultStrategy: 'jwt-cliente' }),
    JwtModule.register({
      secret: getCustomerJwtSecret(),
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [ClienteAuthController],
  providers: [
    ClienteAuthService,
    ClienteJwtStrategy,
    ClienteJwtAuthGuard,
    {
      provide: CLIENTE_RESET_TOKEN_REPOSITORY,
      useClass: PrismaClienteResetTokenRepository,
    },
  ],
  exports: [ClienteJwtAuthGuard],
})
export class ClienteAuthModule {}
