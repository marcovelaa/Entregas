import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISO_KEY = 'requiredPermiso';
export const RequierePermiso = (permiso: string) => SetMetadata(REQUIRED_PERMISO_KEY, permiso);
