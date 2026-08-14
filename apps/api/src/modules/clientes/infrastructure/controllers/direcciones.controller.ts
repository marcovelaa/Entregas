import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../../iam/auth/decorators/public.decorator';
import { ClienteJwtAuthGuard } from '../../auth/guards/cliente-jwt-auth.guard';
import {
  ClienteActual,
  type AuthenticatedCliente,
  requireAuthenticatedCliente,
} from '../../auth/decorators/cliente-actual.decorator';
import { ListarDireccionesUseCase } from '../../application/use-cases/direcciones/listar-direcciones.use-case';
import { CrearDireccionUseCase } from '../../application/use-cases/direcciones/crear-direccion.use-case';
import { ActualizarDireccionUseCase } from '../../application/use-cases/direcciones/actualizar-direccion.use-case';
import { EliminarDireccionUseCase } from '../../application/use-cases/direcciones/eliminar-direccion.use-case';
import { MarcarDireccionPrincipalUseCase } from '../../application/use-cases/direcciones/marcar-direccion-principal.use-case';
import {
  CrearDireccionDto,
  ActualizarDireccionDto,
} from '../../application/dtos/direccion.dto';

@Controller('clientes/me/direcciones')
@Public()
@UseGuards(ClienteJwtAuthGuard)
export class DireccionesController {
  constructor(
    private readonly listarDireccionesUseCase: ListarDireccionesUseCase,
    private readonly crearDireccionUseCase: CrearDireccionUseCase,
    private readonly actualizarDireccionUseCase: ActualizarDireccionUseCase,
    private readonly eliminarDireccionUseCase: EliminarDireccionUseCase,
    private readonly marcarDireccionPrincipalUseCase: MarcarDireccionPrincipalUseCase,
  ) {}

  @Get()
  async listar(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.listarDireccionesUseCase.execute(cliente.id);
  }

  @Post()
  async crear(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Body() dto: CrearDireccionDto,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.crearDireccionUseCase.execute(cliente.id, dto);
  }

  @Put(':id')
  async actualizar(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Param('id') id: string,
    @Body() dto: ActualizarDireccionDto,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    return this.actualizarDireccionUseCase.execute(cliente.id, id, dto);
  }

  @Delete(':id')
  async eliminar(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Param('id') id: string,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    await this.eliminarDireccionUseCase.execute(cliente.id, id);
    return { ok: true };
  }

  @Patch(':id/principal')
  async marcarPrincipal(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Param('id') id: string,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    await this.marcarDireccionPrincipalUseCase.execute(cliente.id, id);
    return { ok: true };
  }
}
