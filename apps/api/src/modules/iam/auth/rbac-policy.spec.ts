import { ALL_PERMISSIONS, BASE_ROLE_PERMISSIONS } from './rbac-policy';

describe('RBAC base role matrix', () => {
  const allCodes = ALL_PERMISSIONS.map((permission) => permission.codigo);

  it('grants every defined permission to Super Usuario', () => {
    expect(BASE_ROLE_PERMISSIONS['Super Usuario']).toEqual(allCodes);
  });

  it('keeps IAM privilege assignment exclusive to Super Usuario', () => {
    const adminPermissions = BASE_ROLE_PERMISSIONS.Administrador;

    expect(adminPermissions).toContain('iam:usuarios:ver');
    expect(adminPermissions).toContain('iam:usuarios:cambiar_estado');
    expect(adminPermissions).not.toEqual(
      expect.arrayContaining([
        'iam:usuarios:crear',
        'iam:usuarios:editar',
        'iam:usuarios:cambiar_rol',
        'iam:roles:asignar_permisos',
      ]),
    );
    expect(BASE_ROLE_PERMISSIONS['Encargado de Ventas']).not.toEqual(
      expect.arrayContaining([
        'iam:usuarios:cambiar_rol',
        'iam:roles:asignar_permisos',
      ]),
    );
  });

  it('limits Vendedor to POS checkout and discount validation', () => {
    expect(BASE_ROLE_PERMISSIONS.Vendedor).toEqual([
      'ventas:crear',
      'descuentos:validar',
    ]);
  });
  it('keeps catalog and supplier mutations outside the Vendedor role', () => {
    expect(BASE_ROLE_PERMISSIONS.Administrador).toEqual(
      expect.arrayContaining([
        'catalogo:crear',
        'clientes:crear',
        'proveedores:crear',
      ]),
    );
    expect(BASE_ROLE_PERMISSIONS['Encargado de Ventas']).toContain(
      'clientes:crear',
    );
    expect(BASE_ROLE_PERMISSIONS.Vendedor).not.toEqual(
      expect.arrayContaining([
        'catalogo:crear',
        'clientes:crear',
        'proveedores:crear',
      ]),
    );
  });
});
