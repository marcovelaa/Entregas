import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CrearCategoriaUseCase } from '../../application/use-cases/categorias/crear-categoria.use-case';
import { ActualizarCategoriaUseCase } from '../../application/use-cases/categorias/actualizar-categoria.use-case';
import { ListarCategoriasUseCase } from '../../application/use-cases/categorias/listar-categorias.use-case';
import { ObtenerCategoriaUseCase } from '../../application/use-cases/categorias/obtener-categoria.use-case';
import {
  CrearCategoriaDto,
  ActualizarCategoriaDto,
  ListarCategoriasDto,
} from '../../application/dtos/categoria.dto';
import { ParseBigIntPipe } from '../../../../common/pipes';
import { PaginationDto } from '../../../../common/dto';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

@Controller('categorias')
export class CategoriasController {
  constructor(
    private readonly crearCategoriaUseCase: CrearCategoriaUseCase,
    private readonly actualizarCategoriaUseCase: ActualizarCategoriaUseCase,
    private readonly listarCategoriasUseCase: ListarCategoriasUseCase,
    private readonly obtenerCategoriaUseCase: ObtenerCategoriaUseCase,
  ) {}

  @Post()
  @RequierePermiso('catalogo:gestionar')
  async crear(@Body() dto: CrearCategoriaDto) {
    return this.crearCategoriaUseCase.execute(dto);
  }

  @Get()
  async listar(
    @Query() query: ListarCategoriasDto,
    @Query() pagination: PaginationDto,
  ) {
    return this.listarCategoriasUseCase.execute(
      query,
      pagination.page,
      pagination.limit,
    );
  }

  @Get(':id')
  async obtener(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.obtenerCategoriaUseCase.execute(id);
  }

  @Patch(':id')
  @RequierePermiso('catalogo:gestionar')
  async actualizar(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarCategoriaDto,
  ) {
    return this.actualizarCategoriaUseCase.execute(id, dto);
  }
}
