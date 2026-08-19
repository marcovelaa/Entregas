import { PermissionDef } from '../types';

export const IAM_PERMISSIONS = [
  { codigo: 'iam:usuarios:ver', modulo: 'iam', descripcion: 'Ver lista y detalle de usuarios' },
  {
    codigo: 'iam:usuarios:crear',
    modulo: 'iam',
    descripcion: 'Crear nuevos usuarios internos',
    excepcion: {
      tipo: 'pendiente',
      motivo: 'usuarios.controller.ts hoy exige iam:usuarios:cambiar_rol en la ruta de creación; se resuelve en la fase de módulo IAM',
    },
  },
  {
    codigo: 'iam:usuarios:editar',
    modulo: 'iam',
    descripcion: 'Editar datos de usuarios',
    excepcion: {
      tipo: 'pendiente',
      motivo: 'usuarios.controller.ts hoy exige iam:usuarios:cambiar_rol en la ruta de edición; se resuelve en la fase de módulo IAM',
    },
  },
  { codigo: 'iam:usuarios:cambiar_estado', modulo: 'iam', descripcion: 'Activar / desactivar usuarios' },
  { codigo: 'iam:usuarios:cambiar_rol', modulo: 'iam', descripcion: 'Reasignar rol a un usuario' },
  { codigo: 'iam:roles:ver', modulo: 'iam', descripcion: 'Ver roles y sus permisos asignados' },
  { codigo: 'iam:roles:crear', modulo: 'iam', descripcion: 'Crear nuevos roles' },
  { codigo: 'iam:roles:editar', modulo: 'iam', descripcion: 'Editar nombre/descripción de roles' },
  { codigo: 'iam:roles:eliminar', modulo: 'iam', descripcion: 'Eliminar roles sin usuarios' },
  { codigo: 'iam:roles:asignar_permisos', modulo: 'iam', descripcion: 'Asignar/quitar permisos a un rol' },
  { codigo: 'iam:bitacora:ver', modulo: 'iam', descripcion: 'Ver el registro de auditoría' },
] as const satisfies readonly PermissionDef[];
