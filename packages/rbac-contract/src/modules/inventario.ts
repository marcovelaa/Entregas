import { PermissionDef } from '../types';

export const INVENTARIO_PERMISSIONS = [
  { codigo: 'inventario:ver', modulo: 'inventario', descripcion: 'Ver stock, alertas y movimientos' },
  { codigo: 'inventario:ajustar', modulo: 'inventario', descripcion: 'Registrar ajustes manuales de stock' },
] as const satisfies readonly PermissionDef[];
