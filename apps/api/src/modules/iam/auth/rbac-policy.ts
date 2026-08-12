export const IAM_PERMISSIONS = [
  {
    codigo: 'iam:usuarios:ver',
    descripcion: 'Ver lista y detalle de usuarios',
  },
  {
    codigo: 'iam:usuarios:crear',
    descripcion: 'Crear nuevos usuarios internos',
  },
  { codigo: 'iam:usuarios:editar', descripcion: 'Editar datos de usuarios' },
  {
    codigo: 'iam:usuarios:cambiar_estado',
    descripcion: 'Activar / desactivar usuarios',
  },
  {
    codigo: 'iam:usuarios:cambiar_rol',
    descripcion: 'Reasignar rol a un usuario',
  },
  {
    codigo: 'iam:roles:ver',
    descripcion: 'Ver roles y sus permisos asignados',
  },
  { codigo: 'iam:roles:crear', descripcion: 'Crear nuevos roles' },
  {
    codigo: 'iam:roles:editar',
    descripcion: 'Editar nombre/descripción de roles',
  },
  { codigo: 'iam:roles:eliminar', descripcion: 'Eliminar roles sin usuarios' },
  {
    codigo: 'iam:roles:asignar_permisos',
    descripcion: 'Asignar/quitar permisos a un rol',
  },
  { codigo: 'iam:bitacora:ver', descripcion: 'Ver el registro de auditoría' },
] as const;

export const DOMAIN_PERMISSIONS = [
  { codigo: 'ventas:ver', descripcion: 'Ver el historial de ventas' },
  { codigo: 'ventas:crear', descripcion: 'Registrar ventas desde el POS' },
  { codigo: 'ventas:anular', descripcion: 'Anular una venta' },
  {
    codigo: 'ventas:revertir_anulacion',
    descripcion: 'Revertir una anulación de venta',
  },
  {
    codigo: 'inventario:ver',
    descripcion: 'Ver stock, alertas y movimientos de inventario',
  },
  {
    codigo: 'inventario:ajustar',
    descripcion: 'Registrar ajustes manuales de inventario',
  },
  { codigo: 'compras:ver', descripcion: 'Ver compras y sus detalles' },
  {
    codigo: 'compras:crear',
    descripcion: 'Registrar compras e ingresos asociados',
  },
  { codigo: 'descuentos:ver', descripcion: 'Ver descuentos y su analítica' },
  {
    codigo: 'descuentos:gestionar',
    descripcion: 'Crear, editar y eliminar descuentos',
  },
  {
    codigo: 'descuentos:validar',
    descripcion: 'Evaluar descuentos aplicables al carrito',
  },
  {
    codigo: 'catalogo:gestionar',
    descripcion: 'Crear, editar y eliminar catálogos de productos',
  },
  {
    codigo: 'clientes:gestionar',
    descripcion: 'Crear y editar clientes',
  },
  {
    codigo: 'proveedores:gestionar',
    descripcion: 'Crear y editar proveedores',
  },
] as const;

export const ALL_PERMISSIONS = [...IAM_PERMISSIONS, ...DOMAIN_PERMISSIONS];

const ADMIN_PERMISSIONS = [
  'iam:usuarios:ver',
  'iam:usuarios:cambiar_estado',
  'ventas:ver',
  'ventas:crear',
  'ventas:anular',
  'ventas:revertir_anulacion',
  'inventario:ver',
  'inventario:ajustar',
  'compras:ver',
  'compras:crear',
  'descuentos:ver',
  'descuentos:gestionar',
  'descuentos:validar',
  'catalogo:gestionar',
  'clientes:gestionar',
  'proveedores:gestionar',
];

const SALES_MANAGER_PERMISSIONS = [
  'ventas:ver',
  'ventas:crear',
  'ventas:anular',
  'ventas:revertir_anulacion',
  'inventario:ver',
  'descuentos:ver',
  'descuentos:gestionar',
  'descuentos:validar',
  'clientes:gestionar',
];

export const BASE_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  'Super Usuario': ALL_PERMISSIONS.map((permission) => permission.codigo),
  Administrador: ADMIN_PERMISSIONS,
  'Encargado de Ventas': SALES_MANAGER_PERMISSIONS,
  Vendedor: ['ventas:crear', 'descuentos:validar'],
};
