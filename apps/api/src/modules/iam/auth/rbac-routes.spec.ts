import 'reflect-metadata';
import { CategoriasController } from '../../catalogo/infrastructure/controllers/categorias.controller';
import { EmpaquesController } from '../../catalogo/infrastructure/controllers/empaques.controller';
import { MarcasController } from '../../catalogo/infrastructure/controllers/marcas.controller';
import { ProductoImagenesController } from '../../catalogo/infrastructure/controllers/producto-imagenes.controller';
import { ProductosController } from '../../catalogo/infrastructure/controllers/productos.controller';
import { VariantesController } from '../../catalogo/infrastructure/controllers/variantes.controller';
import { ClientesController } from '../../clientes/infrastructure/controllers/clientes.controller';
import { ProveedoresController } from '../../proveedores/infrastructure/controllers/proveedores.controller';
import { ComprasController } from '../../compras/infrastructure/controllers/compras.controller';
import { DescuentosController } from '../../descuentos/infrastructure/controllers/descuentos.controller';
import { InventarioController } from '../../inventario/infrastructure/controllers/inventario.controller';
import { VentasController } from '../../ventas/infrastructure/controllers/ventas.controller';
import { PermisosController } from '../infrastructure/controllers/permisos.controller';
import { RolesController } from '../infrastructure/controllers/roles.controller';
import { UsuariosController } from '../infrastructure/controllers/usuarios.controller';
import { AuthController } from './auth.controller';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';
import { REQUIRED_PERMISO_KEY } from './decorators/require-permiso.decorator';

function getMetadata(key: string, target: object): unknown {
  return Reflect.getMetadata(key, target) as unknown;
}

function requiredPermission(
  controller: Record<string, unknown>,
  method: string,
): string | undefined {
  const metadata = getMetadata(
    REQUIRED_PERMISO_KEY,
    controller[method] as object,
  );
  return typeof metadata === 'string' ? metadata : undefined;
}

function methodMetadata(target: object, method: string, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(target, method);
  return descriptor ? getMetadata(key, descriptor.value as object) : undefined;
}

describe('RBAC route metadata', () => {
  it('keeps login and refresh explicitly public', () => {
    expect(
      methodMetadata(AuthController.prototype, 'login', IS_PUBLIC_KEY),
    ).toBe(true);
    expect(
      methodMetadata(AuthController.prototype, 'refresh', IS_PUBLIC_KEY),
    ).toBe(true);
  });

  it('protects critical domain commands with their matching permissions', () => {
    expect(
      requiredPermission(
        VentasController.prototype as unknown as Record<string, unknown>,
        'registrar',
      ),
    ).toBe('ventas:crear');
    expect(
      requiredPermission(
        VentasController.prototype as unknown as Record<string, unknown>,
        'listar',
      ),
    ).toBe('ventas:ver');
    expect(
      methodMetadata(VentasController.prototype, 'listar', IS_PUBLIC_KEY),
    ).toBeUndefined();
    expect(
      requiredPermission(
        VentasController.prototype as unknown as Record<string, unknown>,
        'anular',
      ),
    ).toBe('ventas:anular');
    expect(
      requiredPermission(
        VentasController.prototype as unknown as Record<string, unknown>,
        'revertirAnulacion',
      ),
    ).toBe('ventas:revertir_anulacion');
    expect(
      requiredPermission(
        InventarioController.prototype as unknown as Record<string, unknown>,
        'registrarMovimiento',
      ),
    ).toBe('inventario:ajustar');
    expect(
      requiredPermission(
        ComprasController.prototype as unknown as Record<string, unknown>,
        'registrar',
      ),
    ).toBe('compras:crear');
    expect(
      requiredPermission(
        DescuentosController.prototype as unknown as Record<string, unknown>,
        'crear',
      ),
    ).toBe('descuentos:gestionar');
    expect(
      requiredPermission(
        DescuentosController.prototype as unknown as Record<string, unknown>,
        'validarPromocion',
      ),
    ).toBeUndefined();
  });

  it('reserves privilege-changing IAM routes for their highest required permission', () => {
    expect(
      requiredPermission(
        UsuariosController.prototype as unknown as Record<string, unknown>,
        'create',
      ),
    ).toBe('iam:usuarios:cambiar_rol');
    expect(
      requiredPermission(
        UsuariosController.prototype as unknown as Record<string, unknown>,
        'update',
      ),
    ).toBe('iam:usuarios:cambiar_rol');
    expect(
      requiredPermission(
        RolesController.prototype as unknown as Record<string, unknown>,
        'updatePermisos',
      ),
    ).toBe('iam:roles:asignar_permisos');
    expect(
      requiredPermission(
        PermisosController.prototype as unknown as Record<string, unknown>,
        'findAll',
      ),
    ).toBe('iam:roles:asignar_permisos');
  });
  it('requires management permissions for every catalog, client, and supplier mutation', () => {
    const catalogMutationControllers: Array<
      [Record<string, unknown>, string[]]
    > = [
      [
        CategoriasController.prototype as unknown as Record<string, unknown>,
        ['crear', 'actualizar'],
      ],
      [
        EmpaquesController.prototype as unknown as Record<string, unknown>,
        ['crearBulk', 'crear', 'actualizar'],
      ],
      [
        MarcasController.prototype as unknown as Record<string, unknown>,
        ['crear', 'actualizar', 'eliminar'],
      ],
      [
        ProductoImagenesController.prototype as unknown as Record<
          string,
          unknown
        >,
        ['crear', 'uploadImagen', 'actualizar', 'eliminar'],
      ],
      [
        ProductosController.prototype as unknown as Record<string, unknown>,
        ['crear', 'actualizar', 'eliminar'],
      ],
      [
        VariantesController.prototype as unknown as Record<string, unknown>,
        ['crear', 'crearBulk', 'actualizar', 'eliminar', 'uploadImagen'],
      ],
    ];

    for (const [controller, methods] of catalogMutationControllers) {
      for (const method of methods) {
        expect(requiredPermission(controller, method)).toBe(
          'catalogo:gestionar',
        );
      }
    }

    for (const method of ['crear', 'actualizar']) {
      expect(
        requiredPermission(
          ClientesController.prototype as unknown as Record<string, unknown>,
          method,
        ),
      ).toBe('clientes:gestionar');
      expect(
        requiredPermission(
          ProveedoresController.prototype as unknown as Record<string, unknown>,
          method,
        ),
      ).toBe('proveedores:gestionar');
    }
  });
});
