import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { RequierePermiso } from '../iam/auth/decorators/require-permiso.decorator';
import { ListarGastosUseCase } from './application/use-cases/listar-gastos.use-case';
import { CrearGastoUseCase } from './application/use-cases/crear-gasto.use-case';
import { EliminarGastoUseCase } from './application/use-cases/eliminar-gasto.use-case';
import { CrearGastoDto } from './application/dtos/crear-gasto.dto';

@Controller('gastos')
export class GastosController {
  constructor(
    private readonly listarGastos: ListarGastosUseCase,
    private readonly crearGasto: CrearGastoUseCase,
    private readonly eliminarGasto: EliminarGastoUseCase,
  ) {}

  @Get()
  @RequierePermiso('reportes:ver')
  async listar(@Query('page') page?: string, @Query('limit') limit?: string, @Query('categoria') categoria?: string) {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '50', 10)));
    const offset = (pageNum - 1) * limitNum;
    
    const data = await this.listarGastos.execute({ offset, limit: limitNum, categoria });
    return { success: true, message: 'Gastos obtenidos', data };
  }

  @Post()
  @RequierePermiso('reportes:ver')
  async crear(@Body() dto: CrearGastoDto, @Req() req: any) {
    const usuarioId = req.user?.id || req.user?.sub;
    const data = await this.crearGasto.execute(usuarioId ? usuarioId.toString() : '', dto);
    return { success: true, message: 'Gasto registrado', data };
  }

  @Delete(':id')
  @RequierePermiso('reportes:ver')
  async eliminar(@Param('id') id: string) {
    await this.eliminarGasto.execute(id);
    return { success: true, message: 'Gasto eliminado' };
  }
}
