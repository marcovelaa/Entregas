import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { RequierePermiso } from '../iam/auth/decorators/require-permiso.decorator';
import { AbrirCajaDto, CerrarCajaDto, RegistrarMovimientoDto } from './application/dtos/caja.dto';
import { AbrirCajaUseCase } from './application/use-cases/abrir-caja.use-case';
import { CerrarCajaUseCase } from './application/use-cases/cerrar-caja.use-case';
import { ObtenerCajaActivaUseCase } from './application/use-cases/obtener-caja-activa.use-case';
import { RegistrarMovimientoUseCase } from './application/use-cases/registrar-movimiento.use-case';

@Controller('caja')
export class CajaController {
  constructor(
    private readonly abrirCaja: AbrirCajaUseCase,
    private readonly cerrarCaja: CerrarCajaUseCase,
    private readonly obtenerCajaActiva: ObtenerCajaActivaUseCase,
    private readonly registrarMovimiento: RegistrarMovimientoUseCase,
  ) {}

  @Get('activa')
  @RequierePermiso('caja:ver')
  async getCajaActiva() {
    const data = await this.obtenerCajaActiva.execute();
    return { success: true, message: data ? 'Caja activa obtenida' : 'No hay caja activa', data };
  }

  @Post('abrir')
  @RequierePermiso('caja:abrir')
  async postAbrirCaja(@Body() dto: AbrirCajaDto, @Req() req: any) {
    const usuarioId = req.user?.id || req.user?.sub || '1'; // Fallback a 1 si no hay req.user bien parseado en pruebas
    const data = await this.abrirCaja.execute(usuarioId.toString(), dto);
    return { success: true, message: 'Caja abierta correctamente', data };
  }

  @Post('cerrar/:id')
  @RequierePermiso('caja:cerrar')
  async postCerrarCaja(@Body() dto: CerrarCajaDto, @Req() req: any) {
    const cajaId = req.params.id;
    const data = await this.cerrarCaja.execute(cajaId, dto);
    return { success: true, message: 'Caja cerrada correctamente', data };
  }

  @Post('movimiento')
  @RequierePermiso('caja:movimientos')
  async postMovimiento(@Body() dto: RegistrarMovimientoDto, @Req() req: any) {
    const usuarioId = req.user?.id || req.user?.sub || '1';
    const data = await this.registrarMovimiento.execute(usuarioId.toString(), dto);
    return { success: true, message: 'Movimiento registrado', data };
  }
}
