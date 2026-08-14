import {
  Body,
  Controller,
  Get,
  Inject,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../../iam/auth/decorators/public.decorator';
import { ClienteJwtAuthGuard } from '../../auth/guards/cliente-jwt-auth.guard';
import {
  ClienteActual,
  type AuthenticatedCliente,
  requireAuthenticatedCliente,
} from '../../auth/decorators/cliente-actual.decorator';
import { ActualizarClienteUseCase } from '../../application/use-cases/actualizar-cliente.use-case';
import {
  CLIENTE_REPOSITORY,
  type IClienteRepository,
} from '../../domain/repositories/cliente.repository.interface';
import { ActualizarPerfilDto } from '../../auth/dto/actualizar-perfil.dto';

@Controller('clientes/me')
@Public()
@UseGuards(ClienteJwtAuthGuard)
export class ClientePerfilController {
  constructor(
    @Inject(CLIENTE_REPOSITORY)
    private readonly clienteRepo: IClienteRepository,
    private readonly actualizarClienteUseCase: ActualizarClienteUseCase,
  ) {}

  @Get()
  async miPerfil(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.clienteRepo.obtenerPorId(cliente.id);
  }

  @Patch()
  async actualizarPerfil(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Body() dto: ActualizarPerfilDto,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.actualizarClienteUseCase.execute(cliente.id, dto);
  }
}
