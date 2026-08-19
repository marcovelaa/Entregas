const ROUTE_PERMISSIONS: Array<{ prefix: string; permiso: string }> = [
  { prefix: '/configuracion/usuarios', permiso: 'iam:usuarios:ver' },
  { prefix: '/configuracion/roles', permiso: 'iam:roles:ver' },
  { prefix: '/catalogo', permiso: 'catalogo:ver' },
  { prefix: '/ventas', permiso: 'ventas:ver' },
  { prefix: '/caja', permiso: 'caja:ver' },
  { prefix: '/compras', permiso: 'compras:ver' },
  { prefix: '/inventario', permiso: 'inventario:ver' },
  { prefix: '/clientes', permiso: 'clientes:ver' },
  { prefix: '/proveedores', permiso: 'proveedores:ver' },
  { prefix: '/descuentos', permiso: 'descuentos:ver' },
  { prefix: '/reportes', permiso: 'reportes:ver' },
].sort((a, b) => b.prefix.length - a.prefix.length);

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function requiredPermissionForPath(pathname: string): string | null {
  const match = ROUTE_PERMISSIONS.find((route) =>
    matchesPrefix(pathname, route.prefix),
  );
  return match ? match.permiso : null;
}
