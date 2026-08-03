import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ListarStockUseCase } from '../../application/use-cases/listar-stock.use-case';
import { ListarMovimientosUseCase } from '../../application/use-cases/listar-movimientos.use-case';
import { RegistrarMovimientoUseCase } from '../../application/use-cases/registrar-movimiento.use-case';
import { ListarAlertasUseCase } from '../../application/use-cases/listar-alertas.use-case';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { RegistrarMovimientoDto } from '../../application/dto/registrar-movimiento.dto';

@Controller('inventario')
export class InventarioController {
  constructor(
    private readonly listarStockUseCase: ListarStockUseCase,
    private readonly listarMovimientosUseCase: ListarMovimientosUseCase,
    private readonly registrarMovimientoUseCase: RegistrarMovimientoUseCase,
    private readonly listarAlertasUseCase: ListarAlertasUseCase
  ) {}

  @Get('alertas')
  async listarAlertas() {
    return this.listarAlertasUseCase.execute();
  }

  @Get('stock')
  async listarStock(@Query() dto: PaginationDto) {
    return this.listarStockUseCase.execute(dto);
  }

  @Get('movimientos')
  async listarMovimientos(@Query() dto: PaginationDto) {
    return this.listarMovimientosUseCase.execute(dto);
  }

  @Post('movimientos')
  async registrarMovimiento(@Body() dto: RegistrarMovimientoDto) {
    // TODO: Obtener el ID del usuario del token
    const fakeUsuarioId = 1n; // Hardcodeado por ahora hasta tener auth guard
    return this.registrarMovimientoUseCase.execute(dto, fakeUsuarioId);
  }
}
