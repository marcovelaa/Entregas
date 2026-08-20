import { PermissionDef } from '../types';

export const DESCUENTOS_PERMISSIONS = [
  { codigo: 'descuentos:ver', modulo: 'descuentos', descripcion: 'Ver listado de descuentos' },
  { codigo: 'descuentos:crear', modulo: 'descuentos', descripcion: 'Crear nuevos descuentos' },
  { codigo: 'descuentos:editar', modulo: 'descuentos', descripcion: 'Editar reglas de descuentos' },
  { codigo: 'descuentos:eliminar', modulo: 'descuentos', descripcion: 'Eliminar descuentos' },
  {
    codigo: 'descuentos:validar',
    modulo: 'descuentos',
    descripcion: 'Evaluar descuentos aplicables',
  },
] as const satisfies readonly PermissionDef[];
