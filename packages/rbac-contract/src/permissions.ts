import { IAM_PERMISSIONS } from './modules/iam';
import { CATALOGO_PERMISSIONS } from './modules/catalogo';
import { VENTAS_PERMISSIONS } from './modules/ventas';
import { CAJA_PERMISSIONS } from './modules/caja';
import { COMPRAS_PERMISSIONS } from './modules/compras';
import { INVENTARIO_PERMISSIONS } from './modules/inventario';
import { CLIENTES_PERMISSIONS } from './modules/clientes';
import { PROVEEDORES_PERMISSIONS } from './modules/proveedores';
import { DESCUENTOS_PERMISSIONS } from './modules/descuentos';
import { REPORTES_PERMISSIONS } from './modules/reportes';

export const ALL_PERMISSIONS = [
  ...IAM_PERMISSIONS,
  ...CATALOGO_PERMISSIONS,
  ...VENTAS_PERMISSIONS,
  ...CAJA_PERMISSIONS,
  ...COMPRAS_PERMISSIONS,
  ...INVENTARIO_PERMISSIONS,
  ...CLIENTES_PERMISSIONS,
  ...PROVEEDORES_PERMISSIONS,
  ...DESCUENTOS_PERMISSIONS,
  ...REPORTES_PERMISSIONS,
] as const;

export type PermissionCode = (typeof ALL_PERMISSIONS)[number]['codigo'];
