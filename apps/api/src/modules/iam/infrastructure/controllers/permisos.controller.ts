import { Controller, Get } from '@nestjs/common';
import { ListarPermisosUseCase } from '../../application/use-cases/permisos/listar-permisos.use-case';
import { RequierePermiso } from '../../auth/decorators/require-permiso.decorator';
@Controller('permisos')
export class PermisosController {
  constructor(private readonly listarPermisosUseCase: ListarPermisosUseCase) {}
  @Get()
  @RequierePermiso('iam:roles:asignar_permisos')
  async findAll() {
    return this.listarPermisosUseCase.execute();
  }
}
