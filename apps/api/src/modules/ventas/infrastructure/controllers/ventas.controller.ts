import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RegistrarVentaUseCase } from '../../application/use-cases/registrar-venta.use-case';
import { ListarVentasUseCase } from '../../application/use-cases/listar-ventas.use-case';
import { AnularVentaUseCase } from '../../application/use-cases/anular-venta.use-case';
import { RevertirAnulacionVentaUseCase } from '../../application/use-cases/revertir-anulacion-venta.use-case';
import { RegistrarVentaDto, ListarVentasDto } from '../../application/dtos/venta.dto';

@Controller('ventas')
export class VentasController {
  constructor(
    private readonly registrarVentaUseCase: RegistrarVentaUseCase,
    private readonly listarVentasUseCase: ListarVentasUseCase,
    private readonly anularVentaUseCase: AnularVentaUseCase,
    private readonly revertirAnulacionVentaUseCase: RevertirAnulacionVentaUseCase,
  ) {}

  @Post()
  async registrar(@Body() dto: RegistrarVentaDto) {
    return this.registrarVentaUseCase.execute(dto, '1');
  }

  @Post(':id/anular')
  async anular(@Param('id') id: string, @Body('motivo') motivo: string) {
    if (!motivo) throw new Error('Debe proporcionar un motivo para la anulación');
    return this.anularVentaUseCase.execute(id, '1', motivo);
  }

  @Post(':id/revertir-anulacion')
  async revertirAnulacion(@Param('id') id: string) {
    return this.revertirAnulacionVentaUseCase.execute(id, '1');
  }

  @Get()
  async listar(@Query() dto: ListarVentasDto) {
    return this.listarVentasUseCase.execute(dto);
  }
}
