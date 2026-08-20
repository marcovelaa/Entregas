import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@repo/rbac-contract';

export const REQUIRED_PERMISO_KEY = 'requiredPermiso';
export const RequierePermiso = (permiso: PermissionCode) =>
  SetMetadata(REQUIRED_PERMISO_KEY, permiso);
