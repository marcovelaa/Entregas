export const IAM_PERMISSIONS = [
  { codigo: 'iam:usuarios:ver', descripcion: 'Ver lista y detalle de usuarios' },
  { codigo: 'iam:usuarios:crear', descripcion: 'Crear nuevos usuarios internos' },
  { codigo: 'iam:usuarios:editar', descripcion: 'Editar datos de usuarios' },
  { codigo: 'iam:usuarios:cambiar_estado', descripcion: 'Activar / desactivar usuarios' },
  { codigo: 'iam:usuarios:cambiar_rol', descripcion: 'Reasignar rol a un usuario' },
  { codigo: 'iam:roles:ver', descripcion: 'Ver roles y sus permisos asignados' },
  { codigo: 'iam:roles:crear', descripcion: 'Crear nuevos roles' },
  { codigo: 'iam:roles:editar', descripcion: 'Editar nombre/descripción de roles' },
  { codigo: 'iam:roles:eliminar', descripcion: 'Eliminar roles sin usuarios' },
  { codigo: 'iam:roles:asignar_permisos', descripcion: 'Asignar/quitar permisos a un rol' },
  { codigo: 'iam:bitacora:ver', descripcion: 'Ver el registro de auditoría' },
] as const;

export const DOMAIN_PERMISSIONS = [
  // CATÁLOGO
  { codigo: 'catalogo:ver', descripcion: 'Ver el catálogo de productos' },
  { codigo: 'catalogo:crear', descripcion: 'Crear nuevos productos' },
  { codigo: 'catalogo:editar', descripcion: 'Editar productos existentes' },
  { codigo: 'catalogo:eliminar', descripcion: 'Eliminar productos del catálogo' },

  // VENTAS (POS)
  { codigo: 'ventas:ver', descripcion: 'Ver el historial de ventas' },
  { codigo: 'ventas:crear', descripcion: 'Registrar ventas desde el POS' },
  { codigo: 'ventas:editar', descripcion: 'Editar o registrar devoluciones de ventas' },
  { codigo: 'ventas:anular', descripcion: 'Anular una venta' },
  { codigo: 'ventas:revertir_anulacion', descripcion: 'Revertir una anulación de venta' },

  // CAJA / ARQUEO
  { codigo: 'caja:ver', descripcion: 'Ver estado de caja y arqueos' },
  { codigo: 'caja:abrir', descripcion: 'Abrir caja (Apertura de turno)' },
  { codigo: 'caja:cerrar', descripcion: 'Cerrar caja (Arqueo y cierre)' },
  { codigo: 'caja:movimientos', descripcion: 'Registrar ingresos/egresos manuales' },

  // COMPRAS
  { codigo: 'compras:ver', descripcion: 'Ver compras y sus detalles' },
  { codigo: 'compras:crear', descripcion: 'Registrar compras e ingresos asociados' },
  { codigo: 'compras:anular', descripcion: 'Anular una compra' },

  // INVENTARIO
  { codigo: 'inventario:ver', descripcion: 'Ver stock, alertas y movimientos' },
  { codigo: 'inventario:ajustar', descripcion: 'Registrar ajustes manuales de stock' },

  // CLIENTES
  { codigo: 'clientes:ver', descripcion: 'Ver el listado de clientes' },
  { codigo: 'clientes:crear', descripcion: 'Registrar nuevos clientes' },
  { codigo: 'clientes:editar', descripcion: 'Editar datos de clientes' },
  { codigo: 'clientes:eliminar', descripcion: 'Eliminar clientes del sistema' },

  // PROVEEDORES
  { codigo: 'proveedores:ver', descripcion: 'Ver el listado de proveedores' },
  { codigo: 'proveedores:crear', descripcion: 'Registrar nuevos proveedores' },
  { codigo: 'proveedores:editar', descripcion: 'Editar datos de proveedores' },
  { codigo: 'proveedores:eliminar', descripcion: 'Eliminar proveedores del sistema' },

  // DESCUENTOS
  { codigo: 'descuentos:ver', descripcion: 'Ver listado de descuentos' },
  { codigo: 'descuentos:crear', descripcion: 'Crear nuevos descuentos' },
  { codigo: 'descuentos:editar', descripcion: 'Editar reglas de descuentos' },
  { codigo: 'descuentos:eliminar', descripcion: 'Eliminar descuentos' },
  { codigo: 'descuentos:validar', descripcion: 'Evaluar descuentos aplicables' },

  // REPORTES
  { codigo: 'reportes:ver', descripcion: 'Ver reportes analíticos y de rendimiento' },
] as const;

export const ALL_PERMISSIONS = [...IAM_PERMISSIONS, ...DOMAIN_PERMISSIONS];

const ADMIN_PERMISSIONS = [
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

const SALES_MANAGER_PERMISSIONS = [
  'ventas:ver', 'ventas:crear', 'ventas:editar', 'ventas:anular', 'ventas:revertir_anulacion',
  'caja:ver', 'caja:abrir', 'caja:cerrar', 'caja:movimientos',
  'inventario:ver',
  'clientes:ver', 'clientes:crear', 'clientes:editar',
  'descuentos:ver', 'descuentos:validar',
];

export const BASE_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  'Super Usuario': ALL_PERMISSIONS.map((permission) => permission.codigo),
  Administrador: ADMIN_PERMISSIONS,
  'Encargado de Ventas': SALES_MANAGER_PERMISSIONS,
  Vendedor: ['ventas:crear', 'caja:ver', 'caja:abrir', 'caja:cerrar', 'caja:movimientos', 'clientes:ver', 'clientes:crear', 'descuentos:validar', 'catalogo:ver'],
};
