import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RegistrarCompraUseCase } from '../../application/use-cases/registrar-compra.use-case';
import { ListarComprasUseCase } from '../../application/use-cases/listar-compras.use-case';
import { ObtenerCompraUseCase } from '../../application/use-cases/obtener-compra.use-case';
import {
  RegistrarCompraDto,
  ListarComprasDto,
} from '../../application/dtos/compra.dto';
import {
  CurrentUser,
  requireAuthenticatedUser,
  type AuthenticatedUser,
} from '../../../iam/auth/decorators/current-user.decorator';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

@Controller('compras')
export class ComprasController {
  constructor(
    private readonly registrarCompraUseCase: RegistrarCompraUseCase,
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

  @Get()
  @RequierePermiso('compras:ver')
  async listar(@Query() dto: ListarComprasDto) {
    return this.listarComprasUseCase.execute(dto);
  }

  @Get(':id')
  @RequierePermiso('compras:ver')
  async obtener(@Param('id') id: string) {
    return this.obtenerCompraUseCase.execute(id);
  }
}
