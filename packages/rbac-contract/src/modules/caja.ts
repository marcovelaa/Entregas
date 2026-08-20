import { PermissionDef } from '../types';

export const CAJA_PERMISSIONS = [
  { codigo: 'caja:ver', modulo: 'caja', descripcion: 'Ver estado de caja y arqueos' },
  { codigo: 'caja:abrir', modulo: 'caja', descripcion: 'Abrir caja (apertura de turno)' },
  { codigo: 'caja:cerrar', modulo: 'caja', descripcion: 'Cerrar caja (arqueo y cierre)' },
  { codigo: 'caja:movimientos', modulo: 'caja', descripcion: 'Registrar ingresos/egresos manuales' },
] as const satisfies readonly PermissionDef[];
