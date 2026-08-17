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
  CrearReservaInventarioDto,
} from '../../application/dtos/venta.dto';
import { InventoryReservationsService } from '../../application/services/inventory-reservations.service';
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
    private readonly inventoryReservations?: InventoryReservationsService,
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
    const sellerId = requireAuthenticatedUser(usuario).id;
    return this.registrarVentaUseCase.execute(
      dto,
      sellerId,
    );
  }

  @Post('reservas')
  @RequierePermiso('ventas:crear')
  @ApiOperation({
    summary: 'Reservar stock por 15 minutos mientras se completa un pago QR',
  })
  @ApiResponse({
    status: 201,
    description:
      'Reserva creada; usar su public_id al registrar la venta pagada',
  })
  @ApiResponse({
    status: 409,
    description: 'Stock insuficiente o conflicto concurrente',
  })
  async reservarInventario(
    @Body() dto: CrearReservaInventarioDto,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    if (!this.inventoryReservations)
      throw new BadRequestException(
        'Las reservas de inventario no están disponibles en este entorno.',
      );
    return this.inventoryReservations.create(
      requireAuthenticatedUser(usuario).id,
      dto.detalles,
    );
  }

  @Post('reservas/expirar')
  @RequierePermiso('ventas:crear')
  @ApiOperation({
    summary:
      'Liberar reservas de inventario vencidas; apto para cron o webhook',
  })
  async expirarReservas() {
    if (!this.inventoryReservations)
      throw new BadRequestException(
        'Las reservas de inventario no están disponibles en este entorno.',
      );
    return this.inventoryReservations.expire();
  }

  @Post('reservas/:publicId/cancelar')
  @RequierePermiso('ventas:crear')
  @ApiOperation({
    summary: 'Cancelar una reserva activa y liberar inmediatamente su stock',
  })
  @ApiParam({ name: 'publicId', description: 'ID público UUID de la reserva' })
  async cancelarReserva(
    @Param('publicId') publicId: string,
    @CurrentUser() usuario: AuthenticatedUser | undefined,
  ) {
    if (!this.inventoryReservations)
      throw new BadRequestException(
        'Las reservas de inventario no están disponibles en este entorno.',
      );
    return this.inventoryReservations.cancel(
      publicId,
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
