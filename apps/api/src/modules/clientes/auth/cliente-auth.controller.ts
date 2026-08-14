import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, seconds } from '@nestjs/throttler';
import { Public } from '../../iam/auth/decorators/public.decorator';
import { ClienteAuthService } from './cliente-auth.service';
import { ClienteJwtAuthGuard } from './guards/cliente-jwt-auth.guard';
import {
  ClienteActual,
  type AuthenticatedCliente,
  requireAuthenticatedCliente,
} from './decorators/cliente-actual.decorator';
import { setClienteAuthCookies, clearClienteAuthCookies } from './cookies.util';
import { RegistroClienteDto } from './dto/registro-cliente.dto';
import { LoginClienteDto } from './dto/login-cliente.dto';
import { SolicitarRecuperacionDto } from './dto/solicitar-recuperacion.dto';
import { RestablecerPasswordDto } from './dto/restablecer-password.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';

@Controller('clientes/auth')
export class ClienteAuthController {
  constructor(private readonly clienteAuthService: ClienteAuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  async registro(
    @Body() dto: RegistroClienteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resultado = await this.clienteAuthService.registrar(dto);
    setClienteAuthCookies(res, resultado);
    return { cliente: resultado.cliente };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginClienteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cliente = await this.clienteAuthService.validarCredenciales(
      dto.email,
      dto.password,
    );
    const resultado = this.clienteAuthService.login(cliente);
    setClienteAuthCookies(res, resultado);
    return { cliente: resultado.cliente };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['cliente_refresh_token'];
    if (!refreshToken) {
      clearClienteAuthCookies(res);
      return { cliente: null };
    }
    const resultado = await this.clienteAuthService.refrescar(refreshToken);
    setClienteAuthCookies(res, resultado);
    return { cliente: resultado.cliente };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    clearClienteAuthCookies(res);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('solicitar-recuperacion')
  @HttpCode(HttpStatus.OK)
  async solicitarRecuperacion(@Body() dto: SolicitarRecuperacionDto) {
    const resultado = await this.clienteAuthService.solicitarRecuperacion(
      dto.email,
    );
    return {
      message:
        'Si el correo existe, vas a recibir instrucciones de recuperación.',
      ...resultado,
    };
  }

  @Public()
  @Post('restablecer-password')
  @HttpCode(HttpStatus.OK)
  async restablecerPassword(@Body() dto: RestablecerPasswordDto) {
    await this.clienteAuthService.restablecerPassword(dto.token, dto.password);
    return { ok: true };
  }

  @Public()
  @UseGuards(ClienteJwtAuthGuard)
  @Post('cambiar-password')
  @HttpCode(HttpStatus.OK)
  async cambiarPassword(
    @ClienteActual() clienteActual: AuthenticatedCliente | undefined,
    @Body() dto: CambiarPasswordDto,
  ) {
    const cliente = requireAuthenticatedCliente(clienteActual);
    await this.clienteAuthService.cambiarPassword(
      cliente.id,
      dto.password_actual,
      dto.password_nueva,
    );
    return { ok: true };
  }
}
