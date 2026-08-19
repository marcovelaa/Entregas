import { PermissionDef } from '../types';

export const CATALOGO_PERMISSIONS = [
  {
    codigo: 'catalogo:ver',
    modulo: 'catalogo',
    descripcion: 'Ver el catálogo de productos',
    excepcion: {
      tipo: 'publico',
      motivo: 'apps/frontend (tienda online) consume /productos sin sesión de staff',
    },
  },
  { codigo: 'catalogo:crear', modulo: 'catalogo', descripcion: 'Crear nuevos productos' },
  { codigo: 'catalogo:editar', modulo: 'catalogo', descripcion: 'Editar productos existentes' },
  { codigo: 'catalogo:eliminar', modulo: 'catalogo', descripcion: 'Eliminar productos del catálogo' },
] as const satisfies readonly PermissionDef[];
