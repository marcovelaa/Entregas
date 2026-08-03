import { Controller, Get } from '@nestjs/common';
import { ListarPermisosUseCase } from '../../application/use-cases/permisos/listar-permisos.use-case';
@Controller('permisos')
export class PermisosController {
  constructor(private readonly listarPermisosUseCase: ListarPermisosUseCase) {}
  @Get()
  async findAll() { return this.listarPermisosUseCase.execute(); }
}
