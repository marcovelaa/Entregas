import { Inject, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USUARIO_REPOSITORY } from '../domain/repositories/usuario.repository.interface';
import type { IUsuarioRepository } from '../domain/repositories/usuario.repository.interface';
import { ROL_REPOSITORY } from '../domain/repositories/rol.repository.interface';
import type { IRolRepository } from '../domain/repositories/rol.repository.interface';
import type { Usuario } from '../domain/entities/usuario.entity';
import { getJwtRefreshSecret, getJwtSecret } from './jwt.config';
import { BitacoraService } from '../../bitacora/application/services/bitacora.service';
import { TipoActorBitacora, EntidadBitacora } from '../../bitacora/domain/entities/bitacora-enums';

export interface JwtPayload {
  sub: string;
  email: string;
  rolId: string;
  rolNombre: string;
  permisos: string[];
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioRepository,
    @Inject(ROL_REPOSITORY) private readonly rolRepo: IRolRepository,
    private readonly jwtService: JwtService,
    @Optional() private readonly bitacoraService?: BitacoraService,
  ) {}

  async validarCredenciales(email: string, password: string): Promise<Usuario> {
    const usuario = await this.usuarioRepo.findByEmail(email);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return usuario;
  }

  async login(usuario: Usuario) {
    const rol = await this.rolRepo.findById(usuario.rolId);
    const permisos = await this.rolRepo.getPermisosPorRol(usuario.rolId);

    usuario.registrarAcceso();
    await this.usuarioRepo.update(usuario);

    if (this.bitacoraService) {
      await this.bitacoraService.registrar({
        tipo_actor: TipoActorBitacora.USUARIO,
        usuario_id: usuario.id.toString(),
        entidad: EntidadBitacora.SEGURIDAD,
        entidad_id: usuario.id.toString(),
        operacion: 'LOGIN_EXITOSO',
        datos_nuevos: { email: usuario.email, rol: rol?.nombre },
      });
    }

    const payload: JwtPayload = {
      sub: usuario.id.toString(),
      email: usuario.email,
      rolId: usuario.rolId.toString(),
      rolNombre: rol?.nombre ?? '',
      permisos,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: getJwtSecret(),
        expiresIn: '8h',
      }),
      refresh_token: this.jwtService.sign(
        { sub: payload.sub },
        {
          secret: getJwtRefreshSecret(),
          expiresIn: '7d',
        },
      ),
      usuario: {
        id: usuario.id.toString(),
        publicId: usuario.publicId,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: rol?.nombre ?? null,
      },
    };
  }

  async refrescar(refreshToken: string) {
    let decoded: { sub: string };
    try {
      decoded = this.jwtService.verify(refreshToken, {
        secret: getJwtRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const usuario = await this.usuarioRepo.findById(BigInt(decoded.sub));
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return this.login(usuario);
  }
}
