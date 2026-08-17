import { Controller, Get, Post, Patch, Body, Query, Param } from '@nestjs/common';
import { RegistrarCompraUseCase } from '../../application/use-cases/registrar-compra.use-case';
import { RecibirCompraUseCase } from '../../application/use-cases/recibir-compra.use-case';
import { ActualizarEstadoCompraUseCase } from '../../application/use-cases/actualizar-estado-compra.use-case';
import { AnularCompraUseCase } from '../../application/use-cases/anular-compra.use-case';
import { ListarComprasUseCase } from '../../application/use-cases/listar-compras.use-case';
import { ObtenerCompraUseCase } from '../../application/use-cases/obtener-compra.use-case';
import {
  RegistrarCompraDto,
  RecibirCompraDto,
  ActualizarEstadoCompraDto,
  ListarComprasDto,
} from '../../application/dtos/compra.dto';
import {
  CurrentUser,
  requireAuthenticatedUser,
  type AuthenticatedUser,
} from '../../../iam/auth/decorators/current-user.decorator';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { Public } from '../../../iam/auth/decorators/public.decorator';

@Controller('compras')
export class ComprasController {
  constructor(
    private readonly registrarCompraUseCase: RegistrarCompraUseCase,
    private readonly recibirCompraUseCase: RecibirCompraUseCase,
    private readonly actualizarEstadoCompraUseCase: ActualizarEstadoCompraUseCase,
    private readonly anularCompraUseCase: AnularCompraUseCase,
    private readonly listarComprasUseCase: ListarComprasUseCase,
    private readonly obtenerCompraUseCase: ObtenerCompraUseCase,
  ) {}

  @Post()
  @RequierePermiso('compras:crear')
  async registrar(
    @Body() dto: RegistrarCompraDto,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    return this.registrarCompraUseCase.execute(
      dto,
      requireAuthenticatedUser(usuario).id,
    );
  }

  @Patch(':id/recibir')
  @RequierePermiso('compras:crear')
  async recibir(
    @Param('id') id: string,
    @Body() dto: RecibirCompraDto,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    return this.recibirCompraUseCase.execute(
      id,
      dto,
      requireAuthenticatedUser(usuario).id,
    );
  }

  @Patch(':id/estado')
  @RequierePermiso('compras:crear')
  async cambiarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoCompraDto,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    return this.actualizarEstadoCompraUseCase.execute(
      id,
      dto,
      requireAuthenticatedUser(usuario).id,
    );
  }

  @Patch(':id/anular')
  @RequierePermiso('compras:crear')
  async anular(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    return this.anularCompraUseCase.execute(
      id,
      motivo,
      requireAuthenticatedUser(usuario).id,
    );
  }

  @Get()
  @Public()
  async listar(@Query() dto: ListarComprasDto) {
    return this.listarComprasUseCase.execute(dto);
  }

  @Get(':id')
  @Public()
  async obtener(@Param('id') id: string) {
    return this.obtenerCompraUseCase.execute(id);
  }
}
