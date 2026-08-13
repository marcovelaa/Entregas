import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { CLIENTE_REPOSITORY, type IClienteRepository } from '../../domain/repositories/cliente.repository.interface';
import type { CustomerJwtPayload } from '../cliente-auth.service';
import { getCustomerJwtSecret } from '../jwt-cliente.config';
import type { AuthenticatedCliente } from '../decorators/cliente-actual.decorator';

const extractFromCookie = (req: Request): string | null => {
  return req?.cookies?.['cliente_access_token'] ?? null;
};

@Injectable()
export class ClienteJwtStrategy extends PassportStrategy(Strategy, 'jwt-cliente') {
  constructor(@Inject(CLIENTE_REPOSITORY) private readonly clienteRepo: IClienteRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractFromCookie]),
      ignoreExpiration: false,
      secretOrKey: getCustomerJwtSecret(),
    });
  }

  async validate(payload: CustomerJwtPayload): Promise<AuthenticatedCliente> {
    const cliente = await this.clienteRepo.obtenerConCredencialesPorId(payload.sub);
    if (!cliente || !cliente.activo) {
      throw new UnauthorizedException('Cliente no encontrado o inactivo');
    }
    return {
      id: cliente.id,
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      email: cliente.email,
    };
  }
}
