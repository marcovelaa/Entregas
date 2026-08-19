# Diseño: Contrato de permisos RBAC — taxonomía, sincronización y rollout módulo por módulo

**Alcance:** `apps/api`, `apps/admin`, `packages/rbac-contract` (nuevo), `apps/api/prisma/seed.ts` — 11 módulos de la matriz de permisos + IAM + Caja.
**Fecha:** 2026-08-19.

## Contexto / línea base

- El commit `88a4fbe` ("feat(iam): refactor RBAC matrix, add UI permission locks, and implement global error modal") reescribió `rbac-policy.ts` y el frontend a una matriz de permisos granular nueva, pero no actualizó los controllers del backend — 15 de 31 permisos quedaron declarados sin enforcement real. Se corrigió en la sesión previa a este diseño (backend alineado, Capa 2 de guard de página implementada, `@Public()` indebidos cerrados en compras/pedidos-erp/clientes/proveedores/descuentos).
- **Hallazgo que dispara este diseño:** un usuario con solo `descuentos:validar` llegó a `/descuentos/nuevo` y el backend le devolvió 403 (correcto) — pero el frontend nunca debió dejarlo llegar a esa pantalla. La Capa 2 protegía la sección entera por `descuentos:ver`, no la ruta de acción específica por `descuentos:crear`.
- **Hallazgo técnico de fondo:** `rbac-policy.ts` **no es la fuente de verdad en runtime**. Solo lo consume `apps/api/prisma/seed.ts`. El JWT saca los permisos reales de la tabla `rol_permiso` vía `getPermisosPorRol()`, editable en vivo desde `apps/admin/src/app/configuracion/roles/page.tsx`. Hay dos fuentes de verdad (código y DB) que pueden desincronizarse.
- El seed usa `upsert` tanto para el catálogo (`Permiso`) como para los grants base (`RolPermiso`): **solo agrega, nunca quita**. Revocar un permiso en `rbac-policy.ts` y volver a correr el seed no lo saca de los roles que ya lo tenían.
- Los verbos de permiso son inconsistentes entre módulos sin una regla explícita de cuándo un módulo tiene CRUD completo, parcial, o una "acción especial" (`validar`, `ajustar`, `anular`, `cambiar_rol`...).

## Decisión: modelo de fuente de verdad

**Híbrido.** La DB manda en runtime (`rol_permiso`, editable en vivo desde la pantalla de Roles). El código (`packages/rbac-contract`) deja de pretender ser la autoridad de qué tiene cada rol; pasa a ser:

1. El catálogo de permisos válidos que existen en el sistema (con qué se puebla la tabla `Permiso`, de donde sale el picker de la pantalla Roles).
2. Los valores por defecto de bootstrap para roles nuevos, aplicados una sola vez al crearse el rol — nunca vuelve a pisar un rol ya existente.

## Taxonomía de verbos

- **CRUD estándar** — usar siempre que aplique, nada más: `ver`, `crear`, `editar`, `eliminar`.
- **Verbo especial** — solo cuando la acción dispara una transición de estado o un efecto de negocio que un verbo CRUD no describe honestamente (`ventas:anular` no es delete, es reversar una venta cerrada; `inventario:ajustar` es una corrección de stock, no una edición de ficha; `iam:usuarios:cambiar_rol` es un cambio administrativo sensible, distinto de editar el perfil; `descuentos:validar` es evaluar una regla en el checkout, no escribir el registro).
- **"Gestionar" queda prohibido** como verbo de permiso — es el catch-all que causaba la confusión original; no comunica qué se puede hacer realmente.

## `packages/rbac-contract`

Paquete sin dependencias de NestJS/React/Prisma (mismo patrón que `packages/combo-rules`).

```ts
interface PermissionDef {
  code: `${string}:${string}`;   // 'descuentos:editar'
  modulo: string;
  label: string;                  // texto para el picker de Roles
  publicException?: string;       // por qué esta ruta es @Public() a propósito, si aplica
}
```

Un archivo por módulo (`descuentos.ts`, `catalogo.ts`, ...) que exporta sus `PermissionDef[]`, agregados en un índice `ALL_PERMISSIONS`. `apps/api` y `apps/admin` importan las constantes tipadas de acá — un typo en un código de permiso pasa a ser error de compilación, no un bug silencioso en producción.

## Consumo — backend

`@RequierePermiso` deja de aceptar cualquier string; solo acepta `PermissionCode` del contrato.

## Consumo — frontend (Capa 2 granular por ruta de acción)

`route-permissions.ts` deja de mapear una sección entera a un único permiso `:ver`. Pasa a ser una lista de rutas con su permiso específico, evaluada de más específica a más genérica:

```ts
{ pattern: '/descuentos/nuevo',      permission: 'descuentos:crear' },
{ pattern: '/descuentos/:id/editar', permission: 'descuentos:editar' },
{ pattern: '/descuentos',            permission: 'descuentos:ver' },
```

Con esto, entrar a una ruta de acción sin el permiso específico da el 403 elegante sin importar cómo se llegó ahí (link, botón, URL a mano).

## Reconciliación con la Capa 3 (botón deshabilitado con candado)

Se mantiene tal cual para botones **dentro de una pantalla que el usuario ya puede ver** (ej. "Nuevo Producto" gris en el listado de catálogo si tiene `catalogo:ver` pero no `catalogo:crear`) — es UX útil, no fuga de datos. La Capa 2 (guard de ruta) es la que bloquea el acceso directo a una página de acción sin el permiso correspondiente. Ambas reglas conviven: ver un botón bloqueado en una lista accesible ≠ poder entrar a la página de creación sin permiso.

## Seed: sincronización real

- **Catálogo (`Permiso`):** en cada corrida, agrega los códigos nuevos del contrato y **elimina** los que ya no existen, revocando en cascada los grants de rol que los tuvieran. Loguea explícitamente qué rol perdió qué permiso — nada silencioso.
- **Grants por rol (`RolPermiso`):** los valores de `BASE_ROLE_PERMISSIONS` del contrato solo se aplican **la primera vez que se crea el rol** (bootstrap). Una vez que el rol existe, el seed no vuelve a tocar sus grants — la DB manda y un admin pudo haber personalizado ese rol a propósito.

## Test de auditoría permanente (CI)

Formaliza la auditoría que se hizo a mano con `rg` durante la sesión previa, como test que corre en cada PR:

- **Bloqueante:** todo `code` del contrato debe tener al menos un `@RequierePermiso` real en `apps/api`, salvo que declare `publicException`. Esto es lo que impide que se repita un `@Public()` indebido como el de `GET /clientes`.
- **Warning (no bloquea):** cobertura de cada código en las rutas de `apps/admin` — el backend es el límite de seguridad real, el frontend es UX.

## Orden de rollout módulo por módulo

Fase 0 (una sola vez): crear `packages/rbac-contract`, arreglar el seed, agregar el test de auditoría, construir el mecanismo de rutas de acción en `route-permissions.ts`.

1. **IAM (Roles + Usuarios)** — módulo meta: si la asignación rol→permiso no está sólida, todo lo demás descansa sobre una base insegura. Se resuelve acá la ambigüedad pendiente de `usuarios.controller.ts` (crear/editar piden `cambiar_rol` en vez de `crear`/`editar`).
2. **Descuentos** — ya disparó el bug que originó este diseño y ya tiene camino andado; sirve de implementación de referencia del contrato (incluye el caso público/staff mixto de `validar`).
3. **Catálogo, Compras, Proveedores, Clientes** — ya alineados en backend desde la sesión previa; el trabajo acá es portarlos al contrato tipado y aplicar la granularidad de rutas de acción en frontend.
4. **Ventas/POS** — crítico para el negocio (flujo de caja); se audita con cuidado antes de tocar nada.
5. **Inventario, Reportes, Bitácora** — mayormente solo lectura + una acción especial cada uno; bajo riesgo.
6. **Caja** — ya confirmado correcto en la investigación inicial de la sesión previa; solo falta portarlo al contrato.

## Fuera de alcance / decisiones pendientes (no bloquean este diseño)

- `GET /productos/:id/analitica` sigue `@Public()` — parece una ruta de analítica interna montada sobre la ruta pública de catálogo. Se revisa cuando toque el módulo Catálogo en el rollout.
- `estado-pedido.enum.spec.ts` tiene un test roto preexistente (permite `ENTREGADO → CANCELADO`) — de otro módulo, no relacionado a permisos.
