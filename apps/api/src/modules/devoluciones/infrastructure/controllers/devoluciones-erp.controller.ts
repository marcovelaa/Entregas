import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import {
  CurrentUser,
  type AuthenticatedUser,
  requireAuthenticatedUser,
} from '../../../iam/auth/decorators/current-user.decorator';
import { ListarDevolucionesErpUseCase } from '../../application/use-cases/listar-devoluciones-erp.use-case';
import { EvaluarDevolucionUseCase } from '../../application/use-cases/evaluar-devolucion.use-case';
import { EvaluarDevolucionDto } from '../../application/dtos/evaluar-devolucion.dto';
import { EstadoDevolucion } from '../../domain/entities/devolucion-enums';

@Controller('devoluciones')
export class DevolucionesErpController {
  constructor(
    private readonly listarDevolucionesErpUseCase: ListarDevolucionesErpUseCase,
    private readonly evaluarDevolucionUseCase: EvaluarDevolucionUseCase,
  ) {}

  @Get()
  @RequierePermiso('ventas:ver')
  async listar(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('estado') estado?: EstadoDevolucion,
  ) {
    return this.listarDevolucionesErpUseCase.execute({
      offset: offset ? parseInt(offset, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 50,
      estado,
    });
  }

  @Patch(':id/evaluar')
  @RequierePermiso('ventas:editar')
  async evaluar(
    @Param('id') id: string,
    @Body() dto: EvaluarDevolucionDto,
    @CurrentUser() usuarioActual: AuthenticatedUser | undefined,
  ) {
    const usuario = requireAuthenticatedUser(usuarioActual);
    return this.evaluarDevolucionUseCase.execute(id, dto, usuario.id);
  }
}
