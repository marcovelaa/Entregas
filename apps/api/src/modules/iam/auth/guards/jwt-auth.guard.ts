import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // DEV MODE BYPASS: Always inject a mock Super Admin user for testing
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      request.user = {
        id: 1n,
        publicId: 'dev-superadmin-uuid',
        rolId: 1n,
        permisos: ['*'], // Special wildcard handled in RolesGuard
      };
    }

    if (isPublic) return true;

    // We bypass the actual JWT token verification in dev for testing
    return true; 
  }
}
