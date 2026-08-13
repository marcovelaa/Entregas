import { Controller, Get, Query } from '@nestjs/common';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import { ListarBitacoraErpUseCase } from '../../application/use-cases/listar-bitacora-erp.use-case';

@Controller('bitacora')
export class BitacoraErpController {
  constructor(
    private readonly listarBitacoraErpUseCase: ListarBitacoraErpUseCase,
  ) {}

  @Get()
  @RequierePermiso('iam:bitacora:ver')
  async listar(
    @Query('offset') offset?: string,
    @Query('limit') limit?: string,
    @Query('entidad') entidad?: string,
    @Query('usuario_id') usuario_id?: string,
    @Query('cliente_id') cliente_id?: string,
    @Query('operacion') operacion?: string,
  ) {
    return this.listarBitacoraErpUseCase.execute({
      offset: offset ? parseInt(offset, 10) : 0,
      limit: limit ? parseInt(limit, 10) : 50,
      entidad,
      usuario_id,
      cliente_id,
      operacion,
    });
  }
}
