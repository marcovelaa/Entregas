import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { USUARIO_REPOSITORY } from '../../domain/repositories/usuario.repository.interface';
import type { IUsuarioRepository } from '../../domain/repositories/usuario.repository.interface';
import type { JwtPayload } from '../auth.service';
import { getJwtSecret } from '../jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepo: IUsuarioRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.usuarioRepo.findById(BigInt(payload.sub));
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      id: usuario.id.toString(),
      publicId: usuario.publicId,
      email: usuario.email,
      rolId: payload.rolId,
      rolNombre: payload.rolNombre,
      permisos: payload.permisos,
    };
  }
}
