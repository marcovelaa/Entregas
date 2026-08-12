import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  publicId: string;
  email: string;
  rolId: string;
  rolNombre: string;
  permisos: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>();
    return request.user;
  },
);

export function requireAuthenticatedUser(
  user: AuthenticatedUser | undefined,
): AuthenticatedUser {
  if (!user?.id) {
    throw new UnauthorizedException('Authenticated user is required');
  }

  return user;
}
