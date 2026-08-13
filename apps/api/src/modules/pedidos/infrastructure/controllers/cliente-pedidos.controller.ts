import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CrearPedidoUseCase } from '../../application/use-cases/crear-pedido.use-case';
import { ListarPedidosClienteUseCase } from '../../application/use-cases/listar-pedidos-cliente.use-case';
import { ObtenerPedidoClienteUseCase } from '../../application/use-cases/obtener-pedido-cliente.use-case';
import { CrearPedidoDto } from '../../application/dtos/crear-pedido.dto';

@Controller('clientes/me/pedidos')
@Public()
@UseGuards(ClienteJwtAuthGuard)
export class ClientePedidosController {
  constructor(
    private readonly crearPedidoUseCase: CrearPedidoUseCase,
    private readonly listarPedidosClienteUseCase: ListarPedidosClienteUseCase,
    private readonly obtenerPedidoClienteUseCase: ObtenerPedidoClienteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Body() dto: CrearPedidoDto,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.crearPedidoUseCase.execute(dto, cliente.id);
  }

  @Get()
  async listar(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.listarPedidosClienteUseCase.execute(cliente.id);
  }

  @Get(':id')
  async obtenerPorId(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Param('id') id: string,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.obtenerPedidoClienteUseCase.execute(cliente.id, id);
  }
}
