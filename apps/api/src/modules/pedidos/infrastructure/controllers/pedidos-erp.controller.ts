import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
} from '@nestjs/common';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { Public } from '../../../iam/auth/decorators/public.decorator';
import { ListarPedidosErpUseCase } from '../../application/use-cases/listar-pedidos-erp.use-case';
import { CambiarEstadoPedidoUseCase } from '../../application/use-cases/cambiar-estado-pedido.use-case';
import { CambiarEstadoPedidoDto } from '../../application/dtos/cambiar-estado-pedido.dto';
import { EstadoPedido } from '../../domain/entities/estado-pedido.enum';

@Controller('pedidos')
export class PedidosErpController {
  constructor(
    private readonly listarPedidosErpUseCase: ListarPedidosErpUseCase,
    private readonly cambiarEstadoPedidoUseCase: CambiarEstadoPedidoUseCase,
  ) {}

  @Get()
  @Public()
  async listar(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: EstadoPedido,
    @Query('buscar') buscar?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
    const offset = (pageNum - 1) * limitNum;

    return this.listarPedidosErpUseCase.execute({
      offset,
      limit: limitNum,
      estado,
      buscar,
    });
  }

  @Patch(':id/estado')
  @RequierePermiso('ventas:crear')
  async cambiarEstado(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoPedidoDto,
    @Req() req: any,
  ) {
    const usuarioId = req.user?.id || req.user?.sub;
    return this.cambiarEstadoPedidoUseCase.execute({
      pedidoId: id,
      nuevoEstado: dto.nuevo_estado,
      motivo: dto.motivo,
      usuarioId: usuarioId ? usuarioId.toString() : null,
    });
  }
}
