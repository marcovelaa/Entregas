import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../../iam/auth/decorators/public.decorator';
import { ClienteJwtAuthGuard } from '../../../clientes/auth/guards/cliente-jwt-auth.guard';
import {
  ClienteActual,
  type AuthenticatedCliente,
  requireAuthenticatedCliente,
} from '../../../clientes/auth/decorators/cliente-actual.decorator';
import { SolicitarDevolucionUseCase } from '../../application/use-cases/solicitar-devolucion.use-case';
import { ListarDevolucionesClienteUseCase } from '../../application/use-cases/listar-devoluciones-cliente.use-case';
import { SolicitarDevolucionDto } from '../../application/dtos/solicitar-devolucion.dto';

@Controller('clientes/me/devoluciones')
@Public()
@UseGuards(ClienteJwtAuthGuard)
export class ClienteDevolucionesController {
  constructor(
    private readonly solicitarDevolucionUseCase: SolicitarDevolucionUseCase,
    private readonly listarDevolucionesClienteUseCase: ListarDevolucionesClienteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async solicitar(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Body() dto: SolicitarDevolucionDto,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.solicitarDevolucionUseCase.execute(dto, cliente.id);
  }

  @Get()
  async listar(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.listarDevolucionesClienteUseCase.execute(cliente.id);
  }
}
