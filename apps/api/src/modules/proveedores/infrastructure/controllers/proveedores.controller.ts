import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CrearProveedorUseCase } from '../../application/use-cases/crear-proveedor.use-case';
import { ListarProveedoresUseCase } from '../../application/use-cases/listar-proveedores.use-case';
import { ActualizarProveedorUseCase } from '../../application/use-cases/actualizar-proveedor.use-case';
import {
  CrearProveedorDto,
  ActualizarProveedorDto,
  ListarProveedoresDto,
} from '../../application/dtos/proveedor.dto';
import { ParseBigIntPipe } from '../../../../common/pipes';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { Public } from '../../../iam/auth/decorators/public.decorator';

@Controller('proveedores')
export class ProveedoresController {
  constructor(
    private readonly crearProveedorUseCase: CrearProveedorUseCase,
    private readonly listarProveedoresUseCase: ListarProveedoresUseCase,
    private readonly actualizarProveedorUseCase: ActualizarProveedorUseCase,
  ) {}

  @Post()
  @RequierePermiso('proveedores:gestionar')
  async crear(@Body() dto: CrearProveedorDto) {
    return this.crearProveedorUseCase.execute(dto);
  }

  @Get()
  @Public()
  async listar(@Query() query: ListarProveedoresDto) {
    return this.listarProveedoresUseCase.execute(query);
  }

  @Patch(':id')
  @RequierePermiso('proveedores:gestionar')
  async actualizar(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarProveedorDto,
  ) {
    return this.actualizarProveedorUseCase.execute(id, dto);
  }
}
