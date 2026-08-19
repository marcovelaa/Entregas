import { describe, expect, it } from 'vitest';
import { requiredPermissionForPath } from './route-permissions';

describe('requiredPermissionForPath', () => {
  it('returns the module ver permission for a top-level route', () => {
    expect(requiredPermissionForPath('/catalogo')).toBe('catalogo:ver');
    expect(requiredPermissionForPath('/ventas')).toBe('ventas:ver');
    expect(requiredPermissionForPath('/compras')).toBe('compras:ver');
    expect(requiredPermissionForPath('/inventario')).toBe('inventario:ver');
    expect(requiredPermissionForPath('/clientes')).toBe('clientes:ver');
    expect(requiredPermissionForPath('/proveedores')).toBe('proveedores:ver');
    expect(requiredPermissionForPath('/descuentos')).toBe('descuentos:ver');
    expect(requiredPermissionForPath('/reportes')).toBe('reportes:ver');
    expect(requiredPermissionForPath('/caja')).toBe('caja:ver');
  });

  it('matches nested routes under a guarded module', () => {
    expect(requiredPermissionForPath('/catalogo/productos/123')).toBe(
      'catalogo:ver',
    );
    expect(requiredPermissionForPath('/ventas/historial')).toBe('ventas:ver');
  });

  it('resolves configuracion sub-routes to their own IAM permission', () => {
    expect(requiredPermissionForPath('/configuracion/usuarios')).toBe(
      'iam:usuarios:ver',
    );
    expect(requiredPermissionForPath('/configuracion/roles')).toBe(
      'iam:roles:ver',
    );
  });

  it('does not require a permission for un-mapped or personal routes', () => {
    expect(requiredPermissionForPath('/')).toBeNull();
    expect(requiredPermissionForPath('/perfil')).toBeNull();
    expect(requiredPermissionForPath('/login')).toBeNull();
    expect(requiredPermissionForPath('/configuracion/negocio')).toBeNull();
  });

  it('does not confuse a route with an unrelated prefix (e.g. /ventasx)', () => {
    expect(requiredPermissionForPath('/ventasx')).toBeNull();
  });
});
