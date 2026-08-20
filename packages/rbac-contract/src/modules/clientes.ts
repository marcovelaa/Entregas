import { PermissionDef } from '../types';

export const CLIENTES_PERMISSIONS = [
  { codigo: 'clientes:ver', modulo: 'clientes', descripcion: 'Ver el listado de clientes' },
  { codigo: 'clientes:crear', modulo: 'clientes', descripcion: 'Registrar nuevos clientes' },
  { codigo: 'clientes:editar', modulo: 'clientes', descripcion: 'Editar datos de clientes' },
  {
    codigo: 'clientes:eliminar',
    modulo: 'clientes',
    descripcion: 'Eliminar clientes del sistema',
    excepcion: {
      tipo: 'sin_ruta',
      motivo: 'no existe endpoint DELETE /clientes/:id todavía, sin caso de uso pedido',
    },
  },
] as const satisfies readonly PermissionDef[];
