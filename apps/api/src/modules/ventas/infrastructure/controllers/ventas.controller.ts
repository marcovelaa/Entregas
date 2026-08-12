import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegistrarVentaUseCase } from '../../application/use-cases/registrar-venta.use-case';
import { ListarVentasUseCase } from '../../application/use-cases/listar-ventas.use-case';
import { AnularVentaUseCase } from '../../application/use-cases/anular-venta.use-case';
import { RevertirAnulacionVentaUseCase } from '../../application/use-cases/revertir-anulacion-venta.use-case';
import {
  RegistrarVentaDto,
  ListarVentasDto,
} from '../../application/dtos/venta.dto';
import {
  CurrentUser,
  requireAuthenticatedUser,
  type AuthenticatedUser,
} from '../../../iam/auth/decorators/current-user.decorator';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

@ApiTags('ventas')
@Controller('ventas')
export class VentasController {
  constructor(
    private readonly registrarVentaUseCase: RegistrarVentaUseCase,
    private readonly listarVentasUseCase: ListarVentasUseCase,
    private readonly anularVentaUseCase: AnularVentaUseCase,
    private readonly revertirAnulacionVentaUseCase: RevertirAnulacionVentaUseCase,
  ) {}

  @Post()
  @RequierePermiso('ventas:crear')
  @ApiOperation({ summary: 'Registrar una venta (checkout de POS)' })
  @ApiResponse({
    status: 201,
    description: 'Venta registrada y stock descontado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o monto pagado insuficiente',
  })
  @ApiResponse({
    status: 404,
    description: 'Producto, variante o empaque no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Cupo/vigencia agotados o conflicto de stock concurrente',
  })
  async registrar(
    @Body() dto: RegistrarVentaDto,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    return this.registrarVentaUseCase.execute(
      dto,
      requireAuthenticatedUser(usuario).id,
    );
  }

  @Post(':id/anular')
  @RequierePermiso('ventas:anular')
  @ApiOperation({
    summary: 'Anular una venta y devolver el stock al inventario',
  })
  @ApiParam({ name: 'id', description: 'ID de la venta' })
  @ApiResponse({ status: 201, description: 'Venta anulada y stock retornado' })
  @ApiResponse({ status: 400, description: 'Falta el motivo de anulación' })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  @ApiResponse({ status: 409, description: 'La venta ya se encuentra anulada' })
  async anular(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    const authenticatedUser = requireAuthenticatedUser(usuario);
    if (!motivo)
      throw new BadRequestException(
        'Debe proporcionar un motivo para la anulación',
      );
    return this.anularVentaUseCase.execute(id, authenticatedUser.id, motivo);
  }

  @Post(':id/revertir-anulacion')
  @RequierePermiso('ventas:revertir_anulacion')
  @ApiOperation({ summary: 'Revertir la anulación de una venta' })
  @ApiParam({ name: 'id', description: 'ID de la venta' })
  @ApiResponse({
    status: 201,
    description: 'Anulación revertida y stock descontado nuevamente',
  })
  @ApiResponse({ status: 404, description: 'Venta no encontrada' })
  @ApiResponse({ status: 409, description: 'La venta no está anulada' })
  async revertirAnulacion(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    return this.revertirAnulacionVentaUseCase.execute(
      id,
      requireAuthenticatedUser(usuario).id,
    );
  }

  @Get()
  @RequierePermiso('ventas:ver')
  @ApiOperation({ summary: 'Listar ventas paginadas' })
  @ApiResponse({ status: 200, description: 'Listado paginado de ventas' })
  async listar(@Query() dto: ListarVentasDto) {
    return this.listarVentasUseCase.execute(dto);
  }
}
