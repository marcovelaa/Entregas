# RBAC Contrato — Fase 0 (fundación) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `packages/rbac-contract` como fuente tipada del catálogo de permisos, arreglar la sincronización del seed, agregar el test de auditoría permanente, y cerrar el bug real reportado (`/descuentos/nuevo` alcanzable sin `descuentos:crear`) como implementación de referencia del mecanismo nuevo.

**Architecture:** Un paquete compartido sin dependencias de framework (`packages/rbac-contract`, mismo patrón que `packages/combo-rules`) exporta `PermissionCode` (unión de literales) y `ALL_PERMISSIONS`/`BASE_ROLE_PERMISSIONS` tipados. `apps/api` tipa `@RequierePermiso` contra ese union (typos = error de compilación). `apps/api` suma un test que audita que todo código declarado tenga uso real o una excepción documentada. `apps/api/prisma/seed.ts` sincroniza el catálogo de verdad (agrega y quita) pero solo aplica los permisos base la primera vez que un rol se crea. `apps/admin` reemplaza el matching por prefijo simple por un matcher de segmentos con soporte de wildcard (`*`), permitiendo permisos distintos para `/descuentos`, `/descuentos/nuevo` y `/descuentos/:id`.

**Tech Stack:** TypeScript, NestJS (apps/api), Next.js App Router (apps/admin), Prisma, Jest (apps/api), Vitest (apps/admin), pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-08-19-rbac-contrato-permisos-design.md`

## Global Constraints

- `packages/rbac-contract` no depende de NestJS, React, Next.js ni Prisma (regla de `ARCHITECTURE.md` §1 para `packages/*`).
- Ningún permiso puede quedar sin una de estas dos cosas: uso real en `@RequierePermiso`, o una `excepcion` documentada con motivo.
- El seed nunca vuelve a pisar los permisos de un rol que ya existía antes de esta corrida (la DB manda sobre roles ya creados).
- TDD estricto: test que falla primero, implementación mínima, test en verde, commit.
- No se toca ningún módulo fuera de Descuentos en la granularidad de rutas de frontend — el resto del rollout (`IAM`, `Catálogo`, `Compras`, `Proveedores`, `Clientes`, `Ventas`, `Inventario`, `Reportes`, `Bitácora`, `Caja`) tiene su propio plan futuro, per el orden de la spec.

---

## Task 1: Scaffold `packages/rbac-contract` con el catálogo completo

**Files:**
- Create: `packages/rbac-contract/package.json`
- Create: `packages/rbac-contract/tsconfig.json`
- Create: `packages/rbac-contract/tsconfig.build.json`
- Create: `packages/rbac-contract/src/types.ts`
- Create: `packages/rbac-contract/src/modules/iam.ts`
- Create: `packages/rbac-contract/src/modules/catalogo.ts`
- Create: `packages/rbac-contract/src/modules/ventas.ts`
- Create: `packages/rbac-contract/src/modules/caja.ts`
- Create: `packages/rbac-contract/src/modules/compras.ts`
- Create: `packages/rbac-contract/src/modules/inventario.ts`
- Create: `packages/rbac-contract/src/modules/clientes.ts`
- Create: `packages/rbac-contract/src/modules/proveedores.ts`
- Create: `packages/rbac-contract/src/modules/descuentos.ts`
- Create: `packages/rbac-contract/src/modules/reportes.ts`
- Create: `packages/rbac-contract/src/permissions.ts`
- Create: `packages/rbac-contract/src/base-role-permissions.ts`
- Create: `packages/rbac-contract/src/index.ts`
- Test: `packages/rbac-contract/src/base-role-permissions.spec.ts`
- Modify: `apps/api/package.json` (agregar dependencia + jest `moduleNameMapper`)
- Modify: `apps/api/test/jest-e2e.json` (mismo `moduleNameMapper`)
- Modify: `apps/admin/package.json` (agregar dependencia)
- Modify: `apps/admin/tsconfig.json` (agregar `paths`)
- Modify: `apps/api/prisma/seed.ts` (importar desde el paquete nuevo en vez de `rbac-policy.ts`)
- Delete: `apps/api/src/modules/iam/auth/rbac-policy.ts`
- Delete: `apps/api/src/modules/iam/auth/rbac-policy.spec.ts` (su contenido se muda a `base-role-permissions.spec.ts`)

**Interfaces:**
- Produces: `PermissionDef` (interface), `PermissionCode` (union de literales), `ALL_PERMISSIONS: readonly PermissionDef[]`, `BASE_ROLE_PERMISSIONS: Record<string, PermissionCode[]>` — todo importable desde `@repo/rbac-contract`. Los demás Tasks de este plan dependen de estos cuatro nombres exactos.

- [ ] **Step 1: Escribir el test que falla (RED) — el paquete todavía no existe**

Crear `packages/rbac-contract/src/base-role-permissions.spec.ts`:

```ts
import { ALL_PERMISSIONS, BASE_ROLE_PERMISSIONS } from './index';

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

  it('limits Vendedor to POS checkout, caja, clientes and discount validation', () => {
    expect(BASE_ROLE_PERMISSIONS.Vendedor).toEqual([
      'ventas:crear',
      'caja:ver',
      'caja:abrir',
      'caja:cerrar',
      'caja:movimientos',
      'clientes:ver',
      'clientes:crear',
      'descuentos:validar',
      'catalogo:ver',
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
```

Run: `cd packages/rbac-contract && npx jest` (todavía no hay `package.json`/`jest` config — falla con "command not found" o "no config found"). Esto es la confirmación de RED: el paquete no existe.

- [ ] **Step 2: `package.json`, `tsconfig.json`, `tsconfig.build.json`**

`packages/rbac-contract/package.json`:

```json
{
  "name": "@repo/rbac-contract",
  "version": "0.0.0",
  "private": true,
  "description": "Typed catalog of RBAC permission codes shared by apps/api and apps/admin",
  "license": "MIT",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "test": "jest",
    "check-types": "tsc --noEmit"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/jest": "^30.0.0",
    "@types/node": "^24.0.0",
    "jest": "^30.0.0",
    "ts-jest": "^29.2.5",
    "typescript": "^5.9.2"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "testEnvironment": "node"
  }
}
```

`packages/rbac-contract/tsconfig.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

`packages/rbac-contract/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["src/**/*.spec.ts"]
}
```

Run: `cd /Users/axb/Entregas && pnpm install` (registra el workspace nuevo).

- [ ] **Step 3: `types.ts`**

```ts
export type PermissionExceptionType = 'publico' | 'sin_ruta' | 'pendiente';

export interface PermissionException {
  tipo: PermissionExceptionType;
  motivo: string;
}

export interface PermissionDef {
  codigo: `${string}:${string}`;
  modulo: string;
  descripcion: string;
  excepcion?: PermissionException;
}
```

- [ ] **Step 4: un archivo por módulo, transcribiendo exactamente lo que hoy vive en `rbac-policy.ts`, con las 6 excepciones documentadas**

`packages/rbac-contract/src/modules/iam.ts`:

```ts
import { PermissionDef } from '../types';

export const IAM_PERMISSIONS = [
  { codigo: 'iam:usuarios:ver', modulo: 'iam', descripcion: 'Ver lista y detalle de usuarios' },
  {
    codigo: 'iam:usuarios:crear',
    modulo: 'iam',
    descripcion: 'Crear nuevos usuarios internos',
    excepcion: {
      tipo: 'pendiente',
      motivo: 'usuarios.controller.ts hoy exige iam:usuarios:cambiar_rol en la ruta de creación; se resuelve en la fase de módulo IAM',
    },
  },
  {
    codigo: 'iam:usuarios:editar',
    modulo: 'iam',
    descripcion: 'Editar datos de usuarios',
    excepcion: {
      tipo: 'pendiente',
      motivo: 'usuarios.controller.ts hoy exige iam:usuarios:cambiar_rol en la ruta de edición; se resuelve en la fase de módulo IAM',
    },
  },
  { codigo: 'iam:usuarios:cambiar_estado', modulo: 'iam', descripcion: 'Activar / desactivar usuarios' },
  { codigo: 'iam:usuarios:cambiar_rol', modulo: 'iam', descripcion: 'Reasignar rol a un usuario' },
  { codigo: 'iam:roles:ver', modulo: 'iam', descripcion: 'Ver roles y sus permisos asignados' },
  { codigo: 'iam:roles:crear', modulo: 'iam', descripcion: 'Crear nuevos roles' },
  { codigo: 'iam:roles:editar', modulo: 'iam', descripcion: 'Editar nombre/descripción de roles' },
  { codigo: 'iam:roles:eliminar', modulo: 'iam', descripcion: 'Eliminar roles sin usuarios' },
  { codigo: 'iam:roles:asignar_permisos', modulo: 'iam', descripcion: 'Asignar/quitar permisos a un rol' },
  { codigo: 'iam:bitacora:ver', modulo: 'iam', descripcion: 'Ver el registro de auditoría' },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/catalogo.ts`:

```ts
import { PermissionDef } from '../types';

export const CATALOGO_PERMISSIONS = [
  {
    codigo: 'catalogo:ver',
    modulo: 'catalogo',
    descripcion: 'Ver el catálogo de productos',
    excepcion: {
      tipo: 'publico',
      motivo: 'apps/frontend (tienda online) consume /productos sin sesión de staff',
    },
  },
  { codigo: 'catalogo:crear', modulo: 'catalogo', descripcion: 'Crear nuevos productos' },
  { codigo: 'catalogo:editar', modulo: 'catalogo', descripcion: 'Editar productos existentes' },
  { codigo: 'catalogo:eliminar', modulo: 'catalogo', descripcion: 'Eliminar productos del catálogo' },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/ventas.ts`:

```ts
import { PermissionDef } from '../types';

export const VENTAS_PERMISSIONS = [
  { codigo: 'ventas:ver', modulo: 'ventas', descripcion: 'Ver el historial de ventas' },
  { codigo: 'ventas:crear', modulo: 'ventas', descripcion: 'Registrar ventas desde el POS' },
  { codigo: 'ventas:editar', modulo: 'ventas', descripcion: 'Editar o registrar devoluciones de ventas' },
  { codigo: 'ventas:anular', modulo: 'ventas', descripcion: 'Anular una venta' },
  { codigo: 'ventas:revertir_anulacion', modulo: 'ventas', descripcion: 'Revertir una anulación de venta' },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/caja.ts`:

```ts
import { PermissionDef } from '../types';

export const CAJA_PERMISSIONS = [
  { codigo: 'caja:ver', modulo: 'caja', descripcion: 'Ver estado de caja y arqueos' },
  { codigo: 'caja:abrir', modulo: 'caja', descripcion: 'Abrir caja (apertura de turno)' },
  { codigo: 'caja:cerrar', modulo: 'caja', descripcion: 'Cerrar caja (arqueo y cierre)' },
  { codigo: 'caja:movimientos', modulo: 'caja', descripcion: 'Registrar ingresos/egresos manuales' },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/compras.ts`:

```ts
import { PermissionDef } from '../types';

export const COMPRAS_PERMISSIONS = [
  { codigo: 'compras:ver', modulo: 'compras', descripcion: 'Ver compras y sus detalles' },
  { codigo: 'compras:crear', modulo: 'compras', descripcion: 'Registrar compras e ingresos asociados' },
  { codigo: 'compras:anular', modulo: 'compras', descripcion: 'Anular una compra' },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/inventario.ts`:

```ts
import { PermissionDef } from '../types';

export const INVENTARIO_PERMISSIONS = [
  { codigo: 'inventario:ver', modulo: 'inventario', descripcion: 'Ver stock, alertas y movimientos' },
  { codigo: 'inventario:ajustar', modulo: 'inventario', descripcion: 'Registrar ajustes manuales de stock' },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/clientes.ts`:

```ts
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
```

`packages/rbac-contract/src/modules/proveedores.ts`:

```ts
import { PermissionDef } from '../types';

export const PROVEEDORES_PERMISSIONS = [
  { codigo: 'proveedores:ver', modulo: 'proveedores', descripcion: 'Ver el listado de proveedores' },
  { codigo: 'proveedores:crear', modulo: 'proveedores', descripcion: 'Registrar nuevos proveedores' },
  { codigo: 'proveedores:editar', modulo: 'proveedores', descripcion: 'Editar datos de proveedores' },
  {
    codigo: 'proveedores:eliminar',
    modulo: 'proveedores',
    descripcion: 'Eliminar proveedores del sistema',
    excepcion: {
      tipo: 'sin_ruta',
      motivo: 'no existe endpoint DELETE /proveedores/:id todavía, sin caso de uso pedido',
    },
  },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/descuentos.ts`:

```ts
import { PermissionDef } from '../types';

export const DESCUENTOS_PERMISSIONS = [
  { codigo: 'descuentos:ver', modulo: 'descuentos', descripcion: 'Ver listado de descuentos' },
  { codigo: 'descuentos:crear', modulo: 'descuentos', descripcion: 'Crear nuevos descuentos' },
  { codigo: 'descuentos:editar', modulo: 'descuentos', descripcion: 'Editar reglas de descuentos' },
  { codigo: 'descuentos:eliminar', modulo: 'descuentos', descripcion: 'Eliminar descuentos' },
  {
    codigo: 'descuentos:validar',
    modulo: 'descuentos',
    descripcion: 'Evaluar descuentos aplicables',
    excepcion: {
      tipo: 'publico',
      motivo: 'el checkout de la tienda online valida códigos de descuento sin sesión de staff',
    },
  },
] as const satisfies readonly PermissionDef[];
```

`packages/rbac-contract/src/modules/reportes.ts`:

```ts
import { PermissionDef } from '../types';

export const REPORTES_PERMISSIONS = [
  { codigo: 'reportes:ver', modulo: 'reportes', descripcion: 'Ver reportes analíticos y de rendimiento' },
] as const satisfies readonly PermissionDef[];
```

- [ ] **Step 5: `permissions.ts` — agrega todo y expone `PermissionCode`**

```ts
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
```

- [ ] **Step 6: `base-role-permissions.ts`**

```ts
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
```

- [ ] **Step 7: `index.ts`**

```ts
export * from './types';
export * from './permissions';
export * from './base-role-permissions';
```

- [ ] **Step 8: correr el test, confirmar GREEN**

Run: `cd packages/rbac-contract && npx jest`
Expected: 4/4 tests PASS (los mismos 4 `it()` que ya pasaban en `rbac-policy.spec.ts`, ahora contra el paquete nuevo).

- [ ] **Step 9: registrar el paquete en ambas apps**

`apps/api/package.json` — agregar a `dependencies`:

```json
"@repo/rbac-contract": "workspace:*",
```

En el bloque `"jest"` de `apps/api/package.json`, agregar a `moduleNameMapper` (crear el bloque si no existe, siguiendo el patrón ya usado para `@repo/combo-rules`):

```json
"^@repo/rbac-contract$": "<rootDir>/../../../packages/rbac-contract/src/index.ts"
```

`apps/api/test/jest-e2e.json` — agregar la misma entrada de `moduleNameMapper`.

`apps/admin/package.json` — agregar a `dependencies`:

```json
"@repo/rbac-contract": "workspace:*",
```

`apps/admin/tsconfig.json` — agregar a `compilerOptions.paths`:

```json
"@repo/rbac-contract": ["../../packages/rbac-contract/src/index.ts"]
```

Run: `pnpm install`

- [ ] **Step 10: retirar `rbac-policy.ts` y su spec, apuntar el seed al paquete nuevo**

Borrar `apps/api/src/modules/iam/auth/rbac-policy.ts` y `apps/api/src/modules/iam/auth/rbac-policy.spec.ts` (su contenido ya vive en el Step 1 de esta Task, dentro del paquete).

En `apps/api/prisma/seed.ts`, cambiar:

```ts
import {
  ALL_PERMISSIONS,
  BASE_ROLE_PERMISSIONS,
} from '../src/modules/iam/auth/rbac-policy';
```

por:

```ts
import { ALL_PERMISSIONS, BASE_ROLE_PERMISSIONS } from '@repo/rbac-contract';
```

Y ajustar el bloque de creación de permisos (el shape de `ALL_PERMISSIONS` ahora incluye `modulo`/`excepcion`, que el modelo `Permiso` de Prisma no tiene — pasar solo los campos que existen en el schema):

```ts
for (const p of permisos) {
  await prisma.permiso.upsert({
    where: { codigo: p.codigo },
    update: { descripcion: p.descripcion },
    create: { codigo: p.codigo, descripcion: p.descripcion },
  });
}
```

- [ ] **Step 11: verificar que todo compila y los tests existentes siguen en verde**

Run: `cd apps/api && npx tsc --noEmit`
Expected: sin errores.

Run: `cd apps/api && npx jest --config ./test/jest-e2e.json`
Expected: 17/17 suites, 60/60 tests (sin cambios de comportamiento todavía).

- [ ] **Step 12: Commit**

```bash
git add packages/rbac-contract apps/api/package.json apps/api/test/jest-e2e.json apps/admin/package.json apps/admin/tsconfig.json apps/api/prisma/seed.ts apps/api/src/modules/iam/auth/rbac-policy.ts apps/api/src/modules/iam/auth/rbac-policy.spec.ts pnpm-lock.yaml
git commit -m "feat(rbac): scaffold packages/rbac-contract as the typed permission catalog"
```

---

## Task 2: Tipar `@RequierePermiso` contra el contrato

**Files:**
- Modify: `apps/api/src/modules/iam/auth/decorators/require-permiso.decorator.ts`

**Interfaces:**
- Consumes: `PermissionCode` de `@repo/rbac-contract` (Task 1).
- Produces: `RequierePermiso(permiso: PermissionCode)` — cualquier controller que hoy pase un string que no esté en el union deja de compilar.

- [ ] **Step 1: cambiar el tipo del parámetro**

```ts
import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@repo/rbac-contract';

export const REQUIRED_PERMISO_KEY = 'requiredPermiso';
export const RequierePermiso = (permiso: PermissionCode) =>
  SetMetadata(REQUIRED_PERMISO_KEY, permiso);
```

- [ ] **Step 2: correr `tsc --noEmit` sobre todo `apps/api` — esto audita las 37 llamadas reales existentes contra el contrato**

Run: `cd apps/api && npx tsc --noEmit`
Expected: 0 errores (ya se verificó a mano que los 37 códigos usados en `@RequierePermiso` hoy están los 43 declarados en el contrato — ningún controller usa un código fuera del catálogo).

Si aparece algún error, es porque un controller usa un código que no está en el contrato — corregir el código en el controller (no agregar el código inventado al contrato sin revisar si es un typo real).

- [ ] **Step 3: correr la suite completa para confirmar cero regresiones de comportamiento**

Run: `cd apps/api && npx jest --config ./test/jest-e2e.json`
Expected: 17/17 suites, 60/60 tests.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/iam/auth/decorators/require-permiso.decorator.ts
git commit -m "feat(rbac): type RequierePermiso against the rbac-contract PermissionCode union"
```

---

## Task 3: Test de auditoría permanente (backend)

**Files:**
- Create: `apps/api/src/modules/iam/auth/rbac-enforcement-audit.spec.ts`

**Interfaces:**
- Consumes: `ALL_PERMISSIONS` de `@repo/rbac-contract` (Task 1).

- [ ] **Step 1: escribir el test**

```ts
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { ALL_PERMISSIONS } from '@repo/rbac-contract';

function collectControllerFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...collectControllerFiles(fullPath));
    } else if (entry.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectEnforcedCodes(srcDir: string): Set<string> {
  const codes = new Set<string>();
  const pattern = /@RequierePermiso\('([a-z_:]+)'\)/g;
  for (const file of collectControllerFiles(srcDir)) {
    const content = readFileSync(file, 'utf-8');
    for (const match of content.matchAll(pattern)) {
      codes.add(match[1]);
    }
  }
  return codes;
}

describe('RBAC enforcement audit', () => {
  const srcDir = join(__dirname, '..', '..', '..');
  const enforcedCodes = collectEnforcedCodes(srcDir);

  it('every declared permission is either enforced or has a documented exception', () => {
    const gaps = ALL_PERMISSIONS.filter(
      (permission) =>
        !enforcedCodes.has(permission.codigo) && !permission.excepcion,
    ).map((permission) => permission.codigo);

    expect(gaps).toEqual([]);
  });
});
```

- [ ] **Step 2: probar que el test detecta un gap real (RED controlado) — comentar temporalmente la excepción de `catalogo:ver`**

En `packages/rbac-contract/src/modules/catalogo.ts`, comentar temporalmente el bloque `excepcion` de `catalogo:ver`.

Run: `cd apps/api && npx jest rbac-enforcement-audit`
Expected: FAIL — `gaps` contiene `['catalogo:ver']`.

- [ ] **Step 3: restaurar la excepción, confirmar GREEN**

Deshacer el cambio del Step 2 en `catalogo.ts`.

Run: `cd apps/api && npx jest rbac-enforcement-audit`
Expected: PASS — `gaps` es `[]` (las 6 excepciones documentadas cubren exactamente los 6 códigos sin uso real: `catalogo:ver`, `clientes:eliminar`, `proveedores:eliminar`, `descuentos:validar`, `iam:usuarios:crear`, `iam:usuarios:editar`).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/iam/auth/rbac-enforcement-audit.spec.ts
git commit -m "test(rbac): add permanent audit test for declared-but-unenforced permissions"
```

---

## Task 4: Seed — sincronización real del catálogo, bootstrap-only para roles

**Files:**
- Create: `apps/api/prisma/reconcile-permisos.ts`
- Test: `apps/api/prisma/reconcile-permisos.spec.ts`
- Modify: `apps/api/prisma/seed.ts`

**Interfaces:**
- Produces: `diffCatalogoPermisos(existentes: string[], deseados: string[]): { aAgregar: string[]; aQuitar: string[] }` — función pura, usada por `seed.ts`.

- [ ] **Step 1: escribir el test de la función pura (RED)**

`apps/api/prisma/reconcile-permisos.spec.ts`:

```ts
import { diffCatalogoPermisos } from './reconcile-permisos';

describe('diffCatalogoPermisos', () => {
  it('detecta códigos nuevos para agregar', () => {
    const resultado = diffCatalogoPermisos(['a:ver'], ['a:ver', 'a:crear']);
    expect(resultado.aAgregar).toEqual(['a:crear']);
    expect(resultado.aQuitar).toEqual([]);
  });

  it('detecta códigos retirados para quitar', () => {
    const resultado = diffCatalogoPermisos(['a:ver', 'a:gestionar'], ['a:ver']);
    expect(resultado.aQuitar).toEqual(['a:gestionar']);
    expect(resultado.aAgregar).toEqual([]);
  });

  it('no reporta nada cuando ya está sincronizado', () => {
    const resultado = diffCatalogoPermisos(['a:ver'], ['a:ver']);
    expect(resultado).toEqual({ aAgregar: [], aQuitar: [] });
  });
});
```

Run: `cd apps/api && npx jest reconcile-permisos`
Expected: FAIL — `reconcile-permisos.ts` no existe.

- [ ] **Step 2: implementación mínima**

`apps/api/prisma/reconcile-permisos.ts`:

```ts
export function diffCatalogoPermisos(
  existentes: string[],
  deseados: string[],
): { aAgregar: string[]; aQuitar: string[] } {
  const existentesSet = new Set(existentes);
  const deseadosSet = new Set(deseados);
  return {
    aAgregar: deseados.filter((codigo) => !existentesSet.has(codigo)),
    aQuitar: existentes.filter((codigo) => !deseadosSet.has(codigo)),
  };
}
```

- [ ] **Step 3: correr el test, confirmar GREEN**

Run: `cd apps/api && npx jest reconcile-permisos`
Expected: 3/3 PASS.

- [ ] **Step 4: usar la función en `seed.ts` — sincronizar catálogo de verdad y limitar los grants base a roles nuevos**

Reemplazar el bloque "1. Crear Permisos" y el bloque "3. Asignar los permisos base" en `apps/api/prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ALL_PERMISSIONS, BASE_ROLE_PERMISSIONS } from '@repo/rbac-contract';
import { diffCatalogoPermisos } from './reconcile-permisos';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // 1. Sincronizar el catálogo de permisos (agrega y quita de verdad)
  const codigosExistentes = (await prisma.permiso.findMany({ select: { codigo: true } })).map(
    (p) => p.codigo,
  );
  const codigosDeseados = ALL_PERMISSIONS.map((p) => p.codigo);
  const { aAgregar, aQuitar } = diffCatalogoPermisos(codigosExistentes, codigosDeseados);

  for (const p of ALL_PERMISSIONS.filter((p) => aAgregar.includes(p.codigo))) {
    await prisma.permiso.create({ data: { codigo: p.codigo, descripcion: p.descripcion } });
  }
  for (const p of ALL_PERMISSIONS) {
    await prisma.permiso.update({
      where: { codigo: p.codigo },
      data: { descripcion: p.descripcion },
    });
  }
  for (const codigo of aQuitar) {
    const afectados = await prisma.rolPermiso.findMany({
      where: { permiso_codigo: codigo },
      include: { rol: true },
    });
    if (afectados.length) {
      console.warn(
        `⚠️  Revocando permiso retirado '${codigo}' de: ${afectados.map((a) => a.rol.nombre).join(', ')}`,
      );
    }
    await prisma.permiso.delete({ where: { codigo } });
  }
  console.log(`✅ Catálogo sincronizado (+${aAgregar.length} / -${aQuitar.length})`);

  // 2. Crear Roles Base — recordar cuáles YA existían antes de este upsert,
  //    para no pisar sus grants en el paso 3.
  const roles = [
    { nombre: 'Super Usuario', descripcion: 'Acceso total. No puede ser eliminado ni desactivado.', activo: true },
    { nombre: 'Administrador', descripcion: 'Acceso a gestión interna salvo configuración crítica.', activo: true },
    { nombre: 'Encargado de Ventas', descripcion: 'Gestión de ventas, descuentos y clientes.', activo: true },
    { nombre: 'Vendedor', descripcion: 'Solo puede operar el POS. Sin acceso administrativo.', activo: true },
  ];

  const rolesPreexistentes = new Set<string>();
  for (const r of roles) {
    const existia = await prisma.rol.findUnique({ where: { nombre: r.nombre } });
    if (existia) rolesPreexistentes.add(r.nombre);
    await prisma.rol.upsert({
      where: { nombre: r.nombre },
      update: { descripcion: r.descripcion, activo: r.activo },
      create: r,
    });
  }
  console.log('✅ Roles base insertados/actualizados');

  // 3. Aplicar los permisos base SOLO a roles recién creados en esta corrida.
  //    Si el rol ya existía, la DB manda — un admin pudo haberlo personalizado
  //    desde /configuracion/roles y el seed no debe pisarlo.
  for (const [nombreRol, permisosRol] of Object.entries(BASE_ROLE_PERMISSIONS)) {
    if (rolesPreexistentes.has(nombreRol)) continue;

    const rol = await prisma.rol.findUnique({ where: { nombre: nombreRol } });
    if (!rol) continue; // rol custom sin defaults en el contrato

    for (const permisoCodigo of permisosRol) {
      await prisma.rolPermiso.create({
        data: { rol_id: rol.id, permiso_codigo: permisoCodigo },
      });
    }
  }
  console.log('✅ Permisos base asignados a los roles nuevos');

  // superRol se sigue usando más abajo, en la sección "4. Crear el Super
  // Usuario Inicial" — ya no se declara antes del loop de arriba, así que
  // hay que agregarlo acá:
  const superRol = await prisma.rol.findUnique({ where: { nombre: 'Super Usuario' } });

  // (el resto del archivo — Super Usuario inicial, categorías base — no cambia)
```

(El resto de `main()` a partir de "4. Crear el Super Usuario Inicial" queda igual.)

- [ ] **Step 5: verificar en un entorno de desarrollo (no producción)**

Run: `cd apps/api && npx prisma db seed` (contra la base de dev/test, nunca producción)
Expected: log muestra `✅ Catálogo sincronizado (+0 / -0)` si ya estaba al día, y `✅ Permisos base asignados a los roles nuevos` sin re-otorgar nada a roles que ya existían antes de la corrida.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/reconcile-permisos.ts apps/api/prisma/reconcile-permisos.spec.ts apps/api/prisma/seed.ts
git commit -m "fix(rbac): sync permission catalog for real and stop reseeding existing roles"
```

---

## Task 5: Matcher de rutas por segmentos con wildcard (mecanismo genérico)

**Files:**
- Modify: `apps/admin/src/lib/route-permissions.ts`
- Modify: `apps/admin/src/lib/route-permissions.test.ts`

**Interfaces:**
- Consumes: `PermissionCode` de `@repo/rbac-contract` (Task 1).
- Produces: `requiredPermissionForPath(pathname: string): PermissionCode | null` — misma firma pública que hoy (los consumidores en `AppShell.tsx` no cambian).

- [ ] **Step 1: extender el test existente con los casos que hoy fallan (RED)**

Agregar a `apps/admin/src/lib/route-permissions.test.ts` (mantener todos los `it()` existentes intactos):

```ts
  it('resolves action-specific sub-routes to their own permission, not just the module ver', () => {
    expect(requiredPermissionForPath('/descuentos/nuevo')).toBe('descuentos:crear');
    expect(requiredPermissionForPath('/descuentos/42')).toBe('descuentos:editar');
    expect(requiredPermissionForPath('/descuentos')).toBe('descuentos:ver');
  });
```

Run: `cd apps/admin && npx vitest run route-permissions`
Expected: FAIL — hoy `/descuentos/nuevo` devuelve `descuentos:ver` (el bug real reportado).

- [ ] **Step 2: reemplazar el matcher por segmentos con soporte de wildcard**

```ts
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
```

Nota: `/descuentos/combos/*` no se agrega en esta tarea — hoy cualquier ruta bajo `/descuentos/combos/...` matchea `/descuentos/*` y pide `descuentos:editar` (correcto para editar un combo, impreciso para `/descuentos/combos/nuevo` que debería pedir `descuentos:crear`). Se corrige cuando Descuentos reciba su fase de módulo completa — no es una regresión de seguridad, solo falta de precisión.

- [ ] **Step 3: correr el test completo, confirmar GREEN sin romper los casos existentes**

Run: `cd apps/admin && npx vitest run route-permissions`
Expected: todos los `it()` (los preexistentes + el nuevo) en PASS.

- [ ] **Step 4: `tsc --noEmit` sobre apps/admin**

Run: `cd apps/admin && npx tsc --noEmit`
Expected: 0 errores.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/lib/route-permissions.ts apps/admin/src/lib/route-permissions.test.ts
git commit -m "fix(rbac): guard action sub-routes (e.g. /descuentos/nuevo) by their own permission"
```

---

## Task 6: Verificación end-to-end del bug original

**Files:**
- Test: `apps/admin/src/lib/route-permissions.test.ts` (ya cubierto en Task 5, Step 1 — este task es de verificación manual/documentación, no de código nuevo)

**Interfaces:**
- Consumes: todo lo anterior.

- [ ] **Step 1: reproducir el escenario original manualmente**

Con el servidor de `apps/admin` corriendo y un usuario cuyo rol solo tenga `descuentos:validar` (ej. Vendedor, según `BASE_ROLE_PERMISSIONS`):

1. Iniciar sesión como ese usuario.
2. Navegar directamente a `/descuentos/nuevo`.
3. **Esperado ahora:** pantalla "Acceso Denegado" (Capa 2), no el formulario de creación.
4. Navegar a `/descuentos` (la lista).
5. **Esperado:** 403 también, porque Vendedor tampoco tiene `descuentos:ver` en la matriz base — si el negocio quiere que Vendedor vea la lista de descuentos (no solo validarlos en el POS), es una decisión de producto a revisar en la fase de módulo Descuentos, no de esta Fase 0.

- [ ] **Step 2: correr toda la suite de `apps/api` y `apps/admin` una última vez**

Run: `cd apps/api && npx jest && npx jest --config ./test/jest-e2e.json`
Run: `cd apps/admin && npx vitest run && npx tsc --noEmit`
Expected: todo verde, sin regresiones acumuladas de las 6 tasks.

- [ ] **Step 3: Commit final de la Fase 0 (si quedó algo suelto)**

```bash
git status
# si hay cambios sin commitear de los steps anteriores, commitearlos ahora
```

---

## Fuera de alcance de esta Fase 0 (van en sus propios planes, per el orden de la spec)

1. **Módulo IAM** — resolver `iam:usuarios:crear`/`iam:usuarios:editar` (hoy marcados `pendiente` en el contrato) y auditar Roles/Usuarios a fondo.
2. **Módulo Descuentos completo** — decidir si Vendedor necesita `descuentos:ver`, resolver `/descuentos/combos/*`, portar el módulo entero al patrón de referencia de esta Fase 0.
3. **Catálogo, Compras, Proveedores, Clientes** — portar al contrato tipado + aplicar granularidad de rutas de acción.
4. **Ventas/POS, Inventario, Reportes, Bitácora, Caja** — sin auditar todavía en esta sesión.
