# Diseño: ERP responsive + revisión de arquitectura módulo por módulo

**Alcance:** `apps/admin` (ERP) — 10 módulos + el shell compartido.
**Fecha:** 2026-08-14.

## Alcance

Un solo plan con 11 paquetes de trabajo secuenciales, cada uno auditado y corregido en el mismo pase (responsive + arquitectura), verificado antes de pasar al siguiente:

0. **Shell** — `Sidebar`/`TopBar`/`layout.tsx`, compartido por los 10 módulos.
1. `proveedores`
2. `inventario`
3. `ventas`
4. `clientes`
5. `compras`
6. `dashboard`
7. `configuracion`
8. `descuentos`
9. `caja`
10. `catalogo`

Orden de menor a mayor complejidad/riesgo, para que el patrón responsive y el criterio de extracción de componentes se afiancen en los módulos chicos antes de tocar `caja` (1040 líneas monolíticas) y `catalogo` (21 archivos, el módulo más grande).

## Línea base (relevada antes de diseñar)

- CSS Modules puro, sin Tailwind ni PostCSS custom-media. Tokens de color/fuente en `globals.css`, cero tokens de breakpoint o spacing.
- 60% de los `.module.css` no tienen ningún `@media`. Breakpoints hardcodeados e inconsistentes (1024/768/640/480, mezcla `max-width`/`min-width`) donde sí existen.
- Atomic design (`atoms/molecules/organisms`) existe pero está poco adoptado: `Modal` se reutiliza bien (11 archivos), `Logo` solo lo usa `Sidebar` (legítimo), `SlideOver` no lo importa nadie (huérfano).
- El shell resuelve el colapso del sidebar con un listener de `resize` en JS (`Sidebar.tsx:25-43`), nunca se convierte en drawer, siempre ocupa 60-80px incluso en celular, y no se re-expande si la ventana vuelve a crecer.
- El ERP necesita funcionar bien en celular real (~375px), no solo desde tablet — confirmado con el usuario.

## Estándar responsive

**Breakpoints** (convención documentada con valores literales idénticos en cada archivo — no hay `var()` disponible dentro de `@media` en CSS plano):
- `≤480px` — mobile chico
- `≤768px` — mobile/tablet chico
- `≤1024px` — tablet

Mismos quiebres que ya aparecían sueltos en el código; se estandarizan, no se inventan nuevos.

**Patrones por tipo de contenido:**
- **Tablas** (`ventas`, `compras`, `clientes`, `proveedores`, `inventario`, `catalogo/productos`): por debajo de 768px, tabla → lista de cards apiladas. Nunca `overflow-x` silencioso.
- **Formularios multi-columna** (`descuentos`, wizards de `catalogo`, `configuracion`): grid de N columnas → 1 columna por debajo de 640px.
- **Sidebar** (Paso 0): drawer con overlay + botón hamburguesa, CSS-driven (no JS `resize`), sin flash de SSR.
- **`caja` (POS)**: layout split-view (grilla de productos + panel de cobro) → apilado vertical con el panel de cobro fijo abajo (bottom-sheet), para no perder el total al scrollear productos.

## Checklist de arquitectura (por módulo)

1. **Separación contenedor/presentación**: el `page.tsx` es un contenedor delgado (fetch, estado de alto nivel, routing); compone piezas presentacionales en vez de mezclar todo en un archivo de cientos de líneas.
2. **Ubicación atomic design**: lo reutilizable entre módulos va a `components/{atoms,molecules,organisms}` compartido; lo específico de un módulo va a su carpeta `components/` local (patrón que ya usa `catalogo`). Atom = primitiva visual sin lógica. Molecule = composición chica con estado local. Organism = sección autocontenida con su propio dato/comportamiento.
3. **Disparador de tamaño**: +300 líneas en un archivo es señal para buscar qué extraer, no una regla ciega de partir todo.
4. **Reuso antes que duplicar**: chequear si ya existe algo reutilizable (`Modal`, etc.) antes de crear un componente nuevo.
5. **Huérfanos**: si aparece un componente sin uso en el camino (ej. `SlideOver`), se anota como hallazgo; se limpia solo si es trivial y seguro, sin desviarse del módulo.

## Ejecución

Un solo plan (`docs/superpowers/plans/`) con una tarea por paquete (Shell + 10 módulos), ejecutado con el mismo flujo `subagent-driven-development` ya usado en esta sesión para el paquete 2.1: un subagente implementador por tarea, revisión de spec+calidad después de cada una, loop de corrección acotado si hay hallazgos, y una revisión final de rama completa al terminar los 11 paquetes.

Cada tarea de módulo incluye, como parte de su propio criterio de cierre: verificación visual/manual en al menos 3 anchos de viewport (≤480px, ~768px, desktop), y que el resto de la app no se rompa (build + cualquier test existente que toque ese módulo).
