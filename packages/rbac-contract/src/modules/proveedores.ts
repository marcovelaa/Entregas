import { PermissionDef } from '../types';

export const PROVEEDORES_PERMISSIONS = [
  { codigo: 'proveedores:ver', modulo: 'proveedores', descripcion: 'Ver el listado de proveedores' },
  { codigo: 'proveedores:crear', modulo: 'proveedores', descripcion: 'Registrar nuevos proveedores' },
  { codigo: 'proveedores:editar', modulo: 'proveedores', descripcion: 'Editar datos de proveedores' },
  {
    codigo: 'proveedores:eliminar',
    modulo: 'proveedores',
    descripcion: 'Eliminar proveedores del sistema',
    excepcion: {
      tipo: 'sin_ruta',
      motivo: 'no existe endpoint DELETE /proveedores/:id todavía, sin caso de uso pedido',
    },
  },
] as const satisfies readonly PermissionDef[];
