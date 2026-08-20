import { PermissionDef } from '../types';

export const VENTAS_PERMISSIONS = [
  { codigo: 'ventas:ver', modulo: 'ventas', descripcion: 'Ver el historial de ventas' },
  { codigo: 'ventas:crear', modulo: 'ventas', descripcion: 'Registrar ventas desde el POS' },
  { codigo: 'ventas:editar', modulo: 'ventas', descripcion: 'Editar o registrar devoluciones de ventas' },
  { codigo: 'ventas:anular', modulo: 'ventas', descripcion: 'Anular una venta' },
  { codigo: 'ventas:revertir_anulacion', modulo: 'ventas', descripcion: 'Revertir una anulación de venta' },
] as const satisfies readonly PermissionDef[];
