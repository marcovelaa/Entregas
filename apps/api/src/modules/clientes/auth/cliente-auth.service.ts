import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import {
  CLIENTE_REPOSITORY,
  type IClienteRepository,
  type ClienteConCredenciales,
} from '../domain/repositories/cliente.repository.interface';
import {
  CLIENTE_RESET_TOKEN_REPOSITORY,
  type IClienteResetTokenRepository,
} from '../domain/repositories/cliente-reset-token.repository.interface';
import { getCustomerJwtSecret, getCustomerJwtRefreshSecret } from './jwt-cliente.config';
import { RegistroClienteDto } from './dto/registro-cliente.dto';

export interface CustomerJwtPayload {
  sub: string;
  email: string;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

@Injectable()
export class ClienteAuthService {
  constructor(
    @Inject(CLIENTE_REPOSITORY) private readonly clienteRepo: IClienteRepository,
    @Inject(CLIENTE_RESET_TOKEN_REPOSITORY) private readonly resetTokenRepo: IClienteResetTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistroClienteDto) {
    const existente = await this.clienteRepo.buscarPorEmailConCredenciales(dto.email);
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con este correo electrónico');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const cliente = await this.clienteRepo.crearConCredenciales({
      nombres: dto.nombres,
      apellidos: dto.apellidos,
      email: dto.email,
      telefono: dto.telefono,
      passwordHash,
    });
    return this.emitirTokens(cliente);
  }

  async validarCredenciales(email: string, password: string): Promise<ClienteConCredenciales> {
    const cliente = await this.clienteRepo.buscarPorEmailConCredenciales(email);
    if (!cliente || !cliente.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valido = await bcrypt.compare(password, cliente.passwordHash);
    if (!valido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return cliente;
  }

  login(cliente: ClienteConCredenciales) {
    return this.emitirTokens(cliente);
  }

  async refrescar(refreshToken: string) {
    let decoded: CustomerJwtPayload;
    try {
      decoded = this.jwtService.verify(refreshToken, { secret: getCustomerJwtRefreshSecret() });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    const cliente = await this.clienteRepo.obtenerConCredencialesPorId(decoded.sub);
    if (!cliente || !cliente.activo) {
      throw new UnauthorizedException('Cliente no encontrado o inactivo');
    }
    return this.emitirTokens(cliente);
  }

  async solicitarRecuperacion(email: string): Promise<{ devToken?: string }> {
    const cliente = await this.clienteRepo.buscarPorEmailConCredenciales(email);
    if (!cliente) {
      return {};
    }
    const tokenPlano = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(tokenPlano).digest('hex');
    const expiraEn = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.resetTokenRepo.crear(cliente.id, tokenHash, expiraEn);

    if (process.env.NODE_ENV !== 'production') {
      return { devToken: tokenPlano };
    }
    return {};
  }

  async restablecerPassword(tokenPlano: string, nuevaPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(tokenPlano).digest('hex');
    const registro = await this.resetTokenRepo.buscarPorHash(tokenHash);
    if (!registro || registro.usado || registro.expiraEn.getTime() < Date.now()) {
      throw new BadRequestException('El enlace de recuperación no es válido o expiró');
    }
    const passwordHash = await bcrypt.hash(nuevaPassword, 12);
    await this.clienteRepo.actualizarPassword(registro.clienteId, passwordHash);
    await this.resetTokenRepo.marcarUsado(registro.id);
  }

  async cambiarPassword(clienteId: string, passwordActual: string, passwordNueva: string): Promise<void> {
    const cliente = await this.clienteRepo.obtenerConCredencialesPorId(clienteId);
    if (!cliente) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valido = await bcrypt.compare(passwordActual, cliente.passwordHash);
    if (!valido) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }
    const nuevoHash = await bcrypt.hash(passwordNueva, 12);
    await this.clienteRepo.actualizarPassword(clienteId, nuevoHash);
  }

  private emitirTokens(cliente: ClienteConCredenciales) {
    const payload: CustomerJwtPayload = { sub: cliente.id, email: cliente.email };
    return {
      access_token: this.jwtService.sign(payload, { secret: getCustomerJwtSecret(), expiresIn: '8h' }),
      refresh_token: this.jwtService.sign(payload, { secret: getCustomerJwtRefreshSecret(), expiresIn: '7d' }),
      cliente: {
        id: cliente.id,
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        email: cliente.email,
      },
    };
  }
}
