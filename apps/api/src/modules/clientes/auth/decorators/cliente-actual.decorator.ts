import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthenticatedCliente {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
}

export const ClienteActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedCliente | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedCliente }>();
    return request.user;
  },
);

export function requireAuthenticatedCliente(
  cliente: AuthenticatedCliente | undefined,
): AuthenticatedCliente {
  if (!cliente?.id) {
    throw new UnauthorizedException(
      'Se requiere una sesión de cliente autenticada',
    );
  }
  return cliente;
}
