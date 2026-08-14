import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListarStockUseCase } from '../../application/use-cases/listar-stock.use-case';
import { ListarMovimientosUseCase } from '../../application/use-cases/listar-movimientos.use-case';
import { RegistrarMovimientoUseCase } from '../../application/use-cases/registrar-movimiento.use-case';
import { ListarAlertasUseCase } from '../../application/use-cases/listar-alertas.use-case';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { RegistrarMovimientoDto } from '../../application/dto/registrar-movimiento.dto';
import {
  CurrentUser,
  requireAuthenticatedUser,
  type AuthenticatedUser,
} from '../../../iam/auth/decorators/current-user.decorator';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { Public } from '../../../iam/auth/decorators/public.decorator';

@ApiTags('inventario')
@Controller('inventario')
export class InventarioController {
  constructor(
    private readonly listarStockUseCase: ListarStockUseCase,
    private readonly listarMovimientosUseCase: ListarMovimientosUseCase,
    private readonly registrarMovimientoUseCase: RegistrarMovimientoUseCase,
    private readonly listarAlertasUseCase: ListarAlertasUseCase,
  ) {}

  @Get('alertas')
  @Public()
  @ApiOperation({
    summary: 'Listar productos con stock en o por debajo del mínimo',
  })
  @ApiResponse({ status: 200, description: 'Alertas de stock bajo' })
  async listarAlertas() {
    return this.listarAlertasUseCase.execute();
  }

  @Get('stock')
  @Public()
  @ApiOperation({ summary: 'Listar el stock actual paginado' })
  @ApiResponse({ status: 200, description: 'Listado paginado de inventario' })
  async listarStock(@Query() dto: PaginationDto) {
    return this.listarStockUseCase.execute(dto);
  }

  @Get('movimientos')
  @Public()
  @ApiOperation({
    summary: 'Listar el Kardex de movimientos de inventario, paginado',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado de movimientos' })
  async listarMovimientos(@Query() dto: PaginationDto) {
    return this.listarMovimientosUseCase.execute(dto);
  }

  @Post('movimientos')
  @RequierePermiso('inventario:ajustar')
  @ApiOperation({
    summary:
      'Registrar un movimiento manual de inventario (ajuste, merma, entrada/salida)',
  })
  @ApiResponse({
    status: 201,
    description: 'Movimiento registrado y stock actualizado',
  })
  @ApiResponse({
    status: 409,
    description: 'Stock insuficiente para el movimiento',
  })
  async registrarMovimiento(
    @Body() dto: RegistrarMovimientoDto,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    return this.registrarMovimientoUseCase.execute(
      dto,
      BigInt(requireAuthenticatedUser(usuario).id),
    );
  }
}
