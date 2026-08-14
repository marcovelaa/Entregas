import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISO_KEY } from '../decorators/require-permiso.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermiso = this.reflector.getAllAndOverride<string>(
      REQUIRED_PERMISO_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermiso) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user || !user.permisos?.includes(requiredPermiso)) {
      throw new ForbiddenException(`Requiere el permiso "${requiredPermiso}"`);
    }

    return true;
  }
}
