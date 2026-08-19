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
import { CrearMarcaUseCase } from '../../application/use-cases/marcas/crear-marca.use-case';
import { ListarMarcasUseCase } from '../../application/use-cases/marcas/listar-marcas.use-case';
import { ObtenerMarcaUseCase } from '../../application/use-cases/marcas/obtener-marca.use-case';
import { ActualizarMarcaUseCase } from '../../application/use-cases/marcas/actualizar-marca.use-case';
import { EliminarMarcaUseCase } from '../../application/use-cases/marcas/eliminar-marca.use-case';
import {
  CrearMarcaDto,
  ActualizarMarcaDto,
  ListarMarcasDto,
} from '../../application/dtos/crear-marca.dto';
import { ParseBigIntPipe } from '../../../../common/pipes';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { Public } from '../../../iam/auth/decorators/public.decorator';

@Controller('marcas')
export class MarcasController {
  constructor(
    private readonly crearMarcaUseCase: CrearMarcaUseCase,
    private readonly listarMarcasUseCase: ListarMarcasUseCase,
    private readonly obtenerMarcaUseCase: ObtenerMarcaUseCase,
    private readonly actualizarMarcaUseCase: ActualizarMarcaUseCase,
    private readonly eliminarMarcaUseCase: EliminarMarcaUseCase,
  ) {}

  @Post()
  @RequierePermiso('catalogo:crear')
  async crear(@Body() dto: CrearMarcaDto) {
    return this.crearMarcaUseCase.execute(dto);
  }

  @Get()
  @Public()
  async listar(@Query() query: ListarMarcasDto) {
    return this.listarMarcasUseCase.execute(query, query.page, query.limit);
  }

  @Get(':id')
  @Public()
  async obtener(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.obtenerMarcaUseCase.execute(id);
  }

  @Patch(':id')
  @RequierePermiso('catalogo:editar')
  async actualizar(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarMarcaDto,
  ) {
    return this.actualizarMarcaUseCase.execute(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('catalogo:eliminar')
  async eliminar(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.eliminarMarcaUseCase.execute(id);
  }
}
