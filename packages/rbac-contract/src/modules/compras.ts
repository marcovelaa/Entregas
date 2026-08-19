import { PermissionDef } from '../types';

export const COMPRAS_PERMISSIONS = [
  { codigo: 'compras:ver', modulo: 'compras', descripcion: 'Ver compras y sus detalles' },
  { codigo: 'compras:crear', modulo: 'compras', descripcion: 'Registrar compras e ingresos asociados' },
  { codigo: 'compras:anular', modulo: 'compras', descripcion: 'Anular una compra' },
] as const satisfies readonly PermissionDef[];
