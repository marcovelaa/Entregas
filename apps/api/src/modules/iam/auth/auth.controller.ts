import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, seconds } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: seconds(60) } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con email y contraseña' })
  @ApiResponse({
    status: 200,
    description:
      'Login exitoso: access_token, refresh_token y datos del usuario',
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    const usuario = await this.authService.validarCredenciales(
      dto.email,
      dto.password,
    );
    return this.authService.login(usuario);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar el access_token a partir de un refresh_token vigente',
  })
  @ApiResponse({
    status: 200,
    description: 'Nuevo access_token y refresh_token',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, expirado o usuario inactivo',
  })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refrescar(dto.refresh_token);
  }
}
