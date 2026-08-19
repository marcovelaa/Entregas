import { ALL_PERMISSIONS, PermissionCode } from './permissions';

const ADMIN_PERMISSIONS: PermissionCode[] = [
  'iam:usuarios:ver', 'iam:usuarios:cambiar_estado',
  'ventas:ver', 'ventas:crear', 'ventas:editar', 'ventas:anular', 'ventas:revertir_anulacion',
  'caja:ver', 'caja:abrir', 'caja:cerrar', 'caja:movimientos',
  'inventario:ver', 'inventario:ajustar',
  'compras:ver', 'compras:crear', 'compras:anular',
  'catalogo:ver', 'catalogo:crear', 'catalogo:editar', 'catalogo:eliminar',
  'clientes:ver', 'clientes:crear', 'clientes:editar', 'clientes:eliminar',
  'proveedores:ver', 'proveedores:crear', 'proveedores:editar', 'proveedores:eliminar',
  'descuentos:ver', 'descuentos:crear', 'descuentos:editar', 'descuentos:eliminar', 'descuentos:validar',
  'reportes:ver',
];

const SALES_MANAGER_PERMISSIONS: PermissionCode[] = [
  'ventas:ver', 'ventas:crear', 'ventas:editar', 'ventas:anular', 'ventas:revertir_anulacion',
  'caja:ver', 'caja:abrir', 'caja:cerrar', 'caja:movimientos',
  'inventario:ver',
  'clientes:ver', 'clientes:crear', 'clientes:editar',
  'descuentos:ver', 'descuentos:validar',
];

const VENDEDOR_PERMISSIONS: PermissionCode[] = [
  'ventas:crear', 'caja:ver', 'caja:abrir', 'caja:cerrar', 'caja:movimientos',
  'clientes:ver', 'clientes:crear', 'descuentos:validar', 'catalogo:ver',
];

export const BASE_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  'Super Usuario': ALL_PERMISSIONS.map((permission) => permission.codigo) as PermissionCode[],
  Administrador: ADMIN_PERMISSIONS,
  'Encargado de Ventas': SALES_MANAGER_PERMISSIONS,
  Vendedor: VENDEDOR_PERMISSIONS,
};
