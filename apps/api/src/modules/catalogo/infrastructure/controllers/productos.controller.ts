import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CrearProductoUseCase } from '../../application/use-cases/productos/crear-producto.use-case';
import { ListarProductosUseCase } from '../../application/use-cases/productos/listar-productos.use-case';
import { ObtenerProductoUseCase } from '../../application/use-cases/productos/obtener-producto.use-case';
import { ActualizarProductoUseCase } from '../../application/use-cases/productos/actualizar-producto.use-case';
import { EliminarProductoUseCase } from '../../application/use-cases/productos/eliminar-producto.use-case';
import { ObtenerAnaliticaComboUseCase } from '../../application/use-cases/productos/obtener-analitica-combo.use-case';
import {
  CrearProductoDto,
  ActualizarProductoDto,
  ListarProductosDto,
} from '../../application/dtos/producto.dto';
import { ParseBigIntPipe } from '../../../../common/pipes';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { Public } from '../../../iam/auth/decorators/public.decorator';

@Controller('productos')
export class ProductosController {
  constructor(
    private readonly crearProductoUseCase: CrearProductoUseCase,
    private readonly listarProductosUseCase: ListarProductosUseCase,
    private readonly obtenerProductoUseCase: ObtenerProductoUseCase,
    private readonly actualizarProductoUseCase: ActualizarProductoUseCase,
    private readonly eliminarProductoUseCase: EliminarProductoUseCase,
    private readonly obtenerAnaliticaComboUseCase: ObtenerAnaliticaComboUseCase,
  ) {}

  @Post()
  @RequierePermiso('catalogo:gestionar')
  async crear(@Body() dto: CrearProductoDto) {
    return this.crearProductoUseCase.execute(dto);
  }

  @Get()
  @Public()
  async listar(@Query() query: ListarProductosDto) {
    return this.listarProductosUseCase.execute(query, query.page, query.limit);
  }

  @Get(':id/analitica')
  @RequierePermiso('catalogo:gestionar')
  async obtenerAnalitica(@Param('id', ParseBigIntPipe) id: bigint) {
    const data = await this.obtenerAnaliticaComboUseCase.execute(id);
    return { success: true, data };
  }

  @Get(':publicId')
  @Public()
  async obtener(@Param('publicId') publicId: string) {
    return this.obtenerProductoUseCase.execute(publicId);
  }

  @Patch(':id')
  @RequierePermiso('catalogo:gestionar')
  async actualizar(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarProductoDto,
  ) {
    return this.actualizarProductoUseCase.execute(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('catalogo:gestionar')
  async eliminar(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.eliminarProductoUseCase.execute(id);
  }
}
