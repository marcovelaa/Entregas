import { PermissionDef } from '../types';

export const REPORTES_PERMISSIONS = [
  { codigo: 'reportes:ver', modulo: 'reportes', descripcion: 'Ver reportes analíticos y de rendimiento' },
] as const satisfies readonly PermissionDef[];
