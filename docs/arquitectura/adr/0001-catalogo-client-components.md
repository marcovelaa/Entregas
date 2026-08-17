# ADR 0001: Mantener Client Components en catalogo/page.tsx, productos/[id]/page.tsx y productos/nuevo/page.tsx

## Estado

Aceptado.

## Contexto

Una auditoría de `apps/admin/src/app/catalogo/` contra `ARCHITECTURE.md` §3.1 encontró que el 100% de las rutas del módulo (`catalogo/page.tsx`, `catalogo/marcas/page.tsx`, `catalogo/productos/[id]/page.tsx`, `catalogo/productos/nuevo/page.tsx`) declaraban `'use client'` sin ningún Server Component en el árbol, contradiciendo la regla "Usar `'use client'` solo en el límite que necesita estado, efectos, eventos o APIs del navegador. No convertir árboles completos en Client Components por comodidad."

Al revisar el código real de cada archivo:

- `catalogo/marcas/page.tsx` era un wrapper de 6 líneas sin ningún hook: `'use client'` no tenía justificación. Se corrigió sin riesgo (ver commit asociado).
- `catalogo/page.tsx`, `catalogo/productos/[id]/page.tsx` y `catalogo/productos/nuevo/page.tsx` son, en la práctica, casi enteramente interactivos (tabs, búsqueda, paginación, toggles de estado, o un gate de loading/error que envuelve todo el render). No existe un "shell estático" real que valga la pena extraer a un Server Component aparte de un puñado de líneas de encabezado.
- El único lugar donde convertir a fetch server-side traería un beneficio real (eliminar el spinner de carga inicial en `productos/[id]` y `productos/nuevo`) requiere reenviar la cookie de sesión del navegador al fetch del servidor (vía `cookies()` de `next/headers`), ya que la autenticación de `apps/admin` es por cookie (`withCredentials: true` en `lib/axios.ts`).
- Ese patrón de reenvío de cookie **no existe hoy en ningún lugar del codebase** de `apps/admin`. Sería la primera vez que se introduce.
- `apps/admin/AGENTS.md` advierte explícitamente que la versión de Next.js instalada tiene comportamiento distinto al de la documentación de entrenamiento estándar, y pide revisar `node_modules/next/dist/docs/` antes de escribir código de App Router nuevo.
- No hay forma de probar un login real en navegador desde el entorno de agente disponible (sin `chromium-cli` ni Playwright instalados), por lo que un error de reenvío de cookies (ej. exponer la cookie de sesión a un contexto incorrecto, o un fetch server-side silenciosamente no autenticado) podría pasar sin detectarse hasta producción.

## Decisión

`catalogo/page.tsx`, `catalogo/productos/[id]/page.tsx` y `catalogo/productos/nuevo/page.tsx` permanecen como Client Components completos (`'use client'` en la raíz del archivo). No se introduce fetch server-side con reenvío de cookies de auth en este módulo por ahora.

## Alternativas consideradas

1. **Forzar una separación Server/Client cosmética** (extraer solo el encabezado estático a un Server Component wrapper). Descartada: el beneficio es marginal (unas pocas líneas de JSX estático) y agrega un archivo/indirección nueva sin resolver el problema de fondo que motiva la regla (evitar enviar JS innecesario al cliente).
2. **Convertir a fetch server-side con reenvío de cookie de sesión**, eliminando el spinner de carga inicial. Descartada por ahora: introduce un patrón de autenticación nuevo y sin precedente en el codebase, en una versión de Next.js con comportamiento no estándar documentado, sin poder validar el flujo de login real en navegador desde este entorno.

## Tradeoffs aceptados

- Se mantiene el incumplimiento parcial de la regla de `ARCHITECTURE.md` §3.1 sobre `'use client'` en el límite mínimo, para estos 3 archivos específicamente.
- Se mantiene el costo de rendimiento de enviar el JS completo de estas tres rutas al cliente (ya señalado en la auditoría original, §3.3).
- Se mantiene el spinner de carga inicial en `productos/[id]` y `productos/nuevo` (sin el beneficio de UX de un fetch server-side).

## Alcance

Aplica únicamente a estos 3 archivos de `apps/admin/src/app/catalogo/`. No aplica a `catalogo/marcas/page.tsx` (ya corregido) ni a otros módulos del ERP.

## Condición de revisión o retiro

Revisar esta excepción cuando:

- Se introduzca en `apps/admin` un patrón probado de reenvío de cookie de sesión a fetch server-side (por ejemplo, al resolver esta misma necesidad en otro módulo con capacidad real de probarlo en navegador), o
- Se disponga de un navegador headless (Playwright/`chromium-cli`) en el entorno de desarrollo/CI que permita validar el flujo de login end-to-end antes de introducir el cambio.

## Responsable y deuda resultante

Deuda de arquitectura registrada: incumplimiento parcial de `ARCHITECTURE.md` §3.1 en 3 archivos de `catalogo`, sin plazo fijo de resolución. Responsable de revisión: quien retome el trabajo de performance/SSR del módulo `catalogo`.
