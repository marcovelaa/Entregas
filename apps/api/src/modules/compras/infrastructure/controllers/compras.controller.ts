import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { RegistrarCompraUseCase } from '../../application/use-cases/registrar-compra.use-case';
import { ListarComprasUseCase } from '../../application/use-cases/listar-compras.use-case';
import { ObtenerCompraUseCase } from '../../application/use-cases/obtener-compra.use-case';
import { RegistrarCompraDto, ListarComprasDto } from '../../application/dtos/compra.dto';

@Controller('compras')
export class ComprasController {
  constructor(
    private readonly registrarCompraUseCase: RegistrarCompraUseCase,
    private readonly listarComprasUseCase: ListarComprasUseCase,
    private readonly obtenerCompraUseCase: ObtenerCompraUseCase,
  ) {}

  @Post()
  async registrar(@Body() dto: RegistrarCompraDto) {
    return this.registrarCompraUseCase.execute(dto, '1'); // usuario_id=1 temporalmente
  }

  @Get()
  async listar(@Query() dto: ListarComprasDto) {
    return this.listarComprasUseCase.execute(dto);
  }

  @Get(':id')
  async obtener(@Param('id') id: string) {
    return this.obtenerCompraUseCase.execute(id);
  }
}
