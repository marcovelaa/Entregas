import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DiscountEngineService,
  CartItemInput,
} from '../../domain/discount-engine.service';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';
import {
  ActualizarDescuentoDto,
  ActualizarParcialDescuentoDto,
  CrearDescuentoDto,
} from '../../application/dtos/descuento.dto';
import { ListarDescuentosUseCase } from '../../application/use-cases/listar-descuentos.use-case';
import { ObtenerDescuentoUseCase } from '../../application/use-cases/obtener-descuento.use-case';
import { ObtenerAnaliticaDescuentoUseCase } from '../../application/use-cases/obtener-analitica-descuento.use-case';
import { CrearDescuentoUseCase } from '../../application/use-cases/crear-descuento.use-case';
import { ActualizarParcialDescuentoUseCase } from '../../application/use-cases/actualizar-parcial-descuento.use-case';
import { ActualizarDescuentoUseCase } from '../../application/use-cases/actualizar-descuento.use-case';
import { EliminarDescuentoUseCase } from '../../application/use-cases/eliminar-descuento.use-case';

@ApiTags('descuentos')
@Controller('descuentos')
export class DescuentosController {
  constructor(
    private readonly discountEngine: DiscountEngineService,
    private readonly listarDescuentosUseCase: ListarDescuentosUseCase,
    private readonly obtenerDescuentoUseCase: ObtenerDescuentoUseCase,
    private readonly obtenerAnaliticaDescuentoUseCase: ObtenerAnaliticaDescuentoUseCase,
    private readonly crearDescuentoUseCase: CrearDescuentoUseCase,
    private readonly actualizarParcialDescuentoUseCase: ActualizarParcialDescuentoUseCase,
    private readonly actualizarDescuentoUseCase: ActualizarDescuentoUseCase,
    private readonly eliminarDescuentoUseCase: EliminarDescuentoUseCase,
  ) {}

  @Get()
  @RequierePermiso('descuentos:ver')
  @ApiOperation({
    summary:
      'Listar todos los descuentos con sus alcances (productos/variantes/empaques/categorías)',
  })
  @ApiResponse({ status: 200, description: 'Listado de descuentos' })
  async listar() {
    return this.listarDescuentosUseCase.execute();
  }

  @Get(':id/analitica')
  @RequierePermiso('descuentos:ver')
  @ApiOperation({
    summary:
      'Obtener analítica de uso de un descuento (canjes, ahorro, productos top)',
  })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Analítica del descuento' })
  async obtenerAnalitica(@Param('id') id: string) {
    return this.obtenerAnaliticaDescuentoUseCase.execute(id);
  }

  @Get(':id')
  @RequierePermiso('descuentos:ver')
  @ApiOperation({ summary: 'Obtener un descuento por ID' })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento encontrado' })
  async obtenerPorId(@Param('id') id: string) {
    return this.obtenerDescuentoUseCase.execute(id);
  }

  @Post()
  @RequierePermiso('descuentos:crear')
  @ApiOperation({ summary: 'Crear un descuento o regla promocional' })
  @ApiResponse({ status: 201, description: 'Descuento creado' })
  async crear(@Body() dto: CrearDescuentoDto) {
    return this.crearDescuentoUseCase.execute(dto);
  }

  @Patch(':id')
  @RequierePermiso('descuentos:editar')
  @ApiOperation({
    summary: 'Actualizar parcialmente un descuento (ej. activar/desactivar)',
  })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento actualizado' })
  @ApiResponse({ status: 404, description: 'Descuento no encontrado' })
  async toggleOActualizarParcial(
    @Param('id') id: string,
    @Body() dto: ActualizarParcialDescuentoDto,
  ) {
    return this.actualizarParcialDescuentoUseCase.execute(id, dto);
  }

  @Put(':id')
  @RequierePermiso('descuentos:editar')
  @ApiOperation({ summary: 'Reemplazar un descuento completo' })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento actualizado' })
  @ApiResponse({ status: 404, description: 'Descuento no encontrado' })
  async actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarDescuentoDto,
  ) {
    return this.actualizarDescuentoUseCase.execute(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('descuentos:eliminar')
  @ApiOperation({ summary: 'Eliminar un descuento' })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento eliminado' })
  async eliminar(@Param('id') id: string) {
    return this.eliminarDescuentoUseCase.execute(id);
  }

  @Post('validar')
  @RequierePermiso('descuentos:validar')
  @ApiOperation({
    summary:
      'Evaluar el carrito contra los descuentos/cupones activos y calcular el mejor ahorro aplicable',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado de la evaluación de descuentos',
  })
  async validarPromocion(
    @Body()
    body: {
      cupon?: string;
      canal?: 'POS' | 'ECOMMERCE';
      clienteId?: string;
      items: CartItemInput[];
    },
  ) {
    const evaluacion = await this.discountEngine.evaluateWithReason(body);

    if (!evaluacion.discount) {
      if (body.cupon) {
        return {
          success: false,
          error: evaluacion.rejectionMessage,
          reason: evaluacion.rejectionReason,
        };
      }
      return {
        success: true,
        data: null,
        reason: evaluacion.rejectionReason,
        message: evaluacion.rejectionMessage,
      };
    }

    return {
      success: true,
      data: evaluacion.discount,
    };
  }
}
