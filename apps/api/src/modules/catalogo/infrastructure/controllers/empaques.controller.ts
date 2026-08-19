import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { CrearEmpaqueUseCase } from '../../application/use-cases/empaques/crear-empaque.use-case';
import { ActualizarEmpaqueUseCase } from '../../application/use-cases/empaques/actualizar-empaque.use-case';
import { ListarEmpaquesPorVarianteUseCase } from '../../application/use-cases/empaques/listar-empaques.use-case';
import { CrearEmpaquesBulkUseCase } from '../../application/use-cases/empaques/crear-empaques-bulk.use-case';
import {
  CrearEmpaqueDto,
  ActualizarEmpaqueDto,
  CrearEmpaquesBulkDto,
} from '../../application/dtos/empaque.dto';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { Public } from '../../../iam/auth/decorators/public.decorator';

@Controller('empaques')
export class EmpaquesController {
  constructor(
    private readonly crearEmpaqueUc: CrearEmpaqueUseCase,
    private readonly actualizarEmpaqueUc: ActualizarEmpaqueUseCase,
    private readonly listarEmpaquesUc: ListarEmpaquesPorVarianteUseCase,
    private readonly crearBulkUc: CrearEmpaquesBulkUseCase,
  ) {}

  @Get('variante/:id')
  @Public()
  async listarPorVariante(@Param('id') id: string) {
    const empaques = await this.listarEmpaquesUc.execute(BigInt(id));
    return empaques.map((e) => ({
      ...e,
      id: e.id.toString(),
      variante_id: e.variante_id.toString(),
      precio: e.precio.toString(),
      precio_promocional: e.precio_promocional
        ? e.precio_promocional.toString()
        : null,
    }));
  }

  @Post('bulk')
  @RequierePermiso('catalogo:crear')
  async crearBulk(@Body() dto: CrearEmpaquesBulkDto) {
    const empaques = await this.crearBulkUc.execute(dto);
    return empaques.map((e) => ({
      ...e,
      id: e.id.toString(),
      variante_id: e.variante_id.toString(),
      precio: e.precio.toString(),
      precio_promocional: e.precio_promocional
        ? e.precio_promocional.toString()
        : null,
    }));
  }

  @Post()
  @RequierePermiso('catalogo:crear')
  async crear(@Body() dto: CrearEmpaqueDto) {
    const emp = await this.crearEmpaqueUc.execute(dto);
    return {
      ...emp,
      id: emp.id.toString(),
      variante_id: emp.variante_id.toString(),
      precio: emp.precio.toString(),
    };
  }

  @Patch(':id')
  @RequierePermiso('catalogo:editar')
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarEmpaqueDto) {
    const emp = await this.actualizarEmpaqueUc.execute(BigInt(id), dto);
    return {
      ...emp,
      id: emp.id.toString(),
      variante_id: emp.variante_id.toString(),
      precio: emp.precio.toString(),
    };
  }
}
