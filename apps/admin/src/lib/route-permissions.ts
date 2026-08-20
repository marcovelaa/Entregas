import type { PermissionCode } from '@repo/rbac-contract';

interface RoutePermissionRule {
  pattern: string;
  permission: PermissionCode;
}

// Orden = especificidad: las rutas de acción van antes que el fallback
// genérico del módulo. Un segmento '*' matchea cualquier valor (ids).
const ROUTE_PERMISSIONS: RoutePermissionRule[] = [
  { pattern: '/configuracion/usuarios', permission: 'iam:usuarios:ver' },
  { pattern: '/configuracion/roles', permission: 'iam:roles:ver' },
  { pattern: '/descuentos/nuevo', permission: 'descuentos:crear' },
  { pattern: '/descuentos/*', permission: 'descuentos:editar' },
  { pattern: '/descuentos', permission: 'descuentos:ver' },
  { pattern: '/catalogo', permission: 'catalogo:ver' },
  { pattern: '/ventas', permission: 'ventas:ver' },
  { pattern: '/caja', permission: 'caja:ver' },
  { pattern: '/compras', permission: 'compras:ver' },
  { pattern: '/inventario', permission: 'inventario:ver' },
  { pattern: '/clientes', permission: 'clientes:ver' },
  { pattern: '/proveedores', permission: 'proveedores:ver' },
  { pattern: '/reportes', permission: 'reportes:ver' },
];

function matchesPattern(pathname: string, pattern: string): boolean {
  const pathSegments = pathname.split('/').filter(Boolean);
  const patternSegments = pattern.split('/').filter(Boolean);
  if (pathSegments.length < patternSegments.length) return false;
  return patternSegments.every(
    (segment, i) => segment === '*' || segment === pathSegments[i],
  );
}

export function requiredPermissionForPath(pathname: string): PermissionCode | null {
  const match = ROUTE_PERMISSIONS.find((route) => matchesPattern(pathname, route.pattern));
  return match ? match.permission : null;
}
