# Manual de Auditoría Técnica y Arquitectura del Sistema

Este documento está diseñado para auditores técnicos, arquitectos de software y desarrolladores senior que revisen la base de código en un nuevo entorno de trabajo (como macOS / iMac).

---

## 1. Mapa General de la Arquitectura

El sistema es un Monorepo empresarial desarrollado con **Turborepo**, **NestJS** (Backend) y **Next.js 16** (Frontend Admin y E-commerce).

```
                ┌──────────────────────────────────────────────────────────┐
                │                     APLICACIONES                         │
                ├────────────────────────────┬─────────────────────────────┤
                │   apps/admin (Next.js 16)  │  apps/frontend (Next.js 16) │
                │   • POS (Punto de Venta)   │  • Catálogo Online          │
                │   • Gestión de Catálogo    │  • Carrito & Checkout       │
                │   • Combos & Descuentos    │  • Promociones Dinámicas    │
                │   • Compras & Inventario   │                             │
                └─────────────┬──────────────┴──────────────┬──────────────┘
                              │                             │
                              └──────────────┬──────────────┘
                                             │ HTTP REST / JSON
                                             ▼
                ┌──────────────────────────────────────────────────────────┐
                │                    apps/api (NestJS)                     │
                ├──────────────────────────────────────────────────────────┤
                │  Arquitectura Hexagonal (Puertos y Adaptadores):         │
                │  • Domain: Entidades, Interfaces, Reglas puras           │
                │  • Application: Use Cases (CQRS-lite), DTOs              │
                │  • Infrastructure: Controllers, Prisma, Repositories    │
                └────────────────────────────┬─────────────────────────────┘
                                             │ Prisma ORM
                                             ▼
                ┌──────────────────────────────────────────────────────────┐
                │                  PostgreSQL 15 (Docker)                  │
                │  • Inventario Atómico por Variantes                      │
                │  • Recetas BOM de Combos                                 │
                │  • Trazabilidad de Movimientos & Auditoría               │
                └──────────────────────────────────────────────────────────┘
```

---

## 2. Puntos Clave de Auditoría por Dominio

### A. Catálogo y Patrón de Variante Base Automática
- **Problema previo resuelto:** Anteriormente, los productos simples tenían stock en `inventario` con `variante_id = null`, mientras que los productos con variantes lo tenían en sus registros correspondientes. Esto fragmentaba el stock e impedía crear empaques para productos simples.
- **Solución implementada:** Todo producto simple genera automáticamente una variante base `"Estándar"`.
- **Archivos a inspeccionar:**
  1. [`apps/api/src/modules/catalogo/infrastructure/repositories/prisma-producto.repository.ts`](file:///apps/api/src/modules/catalogo/infrastructure/repositories/prisma-producto.repository.ts):
     - `crear`: Inserta la variante base automáticamente si no se especifican variantes personalizadas.
     - `actualizar`: Sincroniza el precio unitario y promocional de la variante base cuando se edita el producto.
  2. [`apps/admin/src/app/catalogo/productos/components/VariantesSection.tsx`](file:///apps/admin/src/app/catalogo/productos/components/VariantesSection.tsx):
     - Renderiza las variantes y permite configurar **Empaques** directamente para cualquier producto.

---

### B. Motor de Combos & Receta BOM (Bill of Materials)
- **Concepto:** Un combo es un producto virtual cuyo stock depende del producto componente que tenga menor disponibilidad respecto a la cantidad requerida en la receta (*cuello de botella*).
- **Archivos a inspeccionar:**
  1. [`apps/api/src/modules/catalogo/domain/combo-stock.ts`](file:///apps/api/src/modules/catalogo/domain/combo-stock.ts):
     - Función `calcularStockCombo`: Calcula el stock virtual iterando sobre cada componente, tomando en cuenta variantes específicas o variantes base.
  2. [`apps/api/src/modules/catalogo/application/use-cases/productos/obtener-analitica-combo.use-case.ts`](file:///apps/api/src/modules/catalogo/application/use-cases/productos/obtener-analitica-combo.use-case.ts):
     - Provee métricas de rendimiento comercial: kits vendidos, facturación total, margen estimado y stock virtual en tiempo real.
  3. [`apps/admin/src/app/descuentos/combos/components/ComboEditorForm.tsx`](file:///apps/admin/src/app/descuentos/combos/components/ComboEditorForm.tsx):
     - Sección 4 de Disponibilidad: Toggles independientes para Vigencia (fechas y horas), Días específicos de la semana (Lunes a Domingo) y Cupo máximo de ventas.

---

### C. Motor de Descuentos y Promociones
- **Concepto:** Motor de evaluación de reglas de descuento con soporte para:
  - Descuentos por porcentaje o monto fijo.
  - Alcance por Categoría, Marca, Producto o Variante específica.
  - Restricciones por días de la semana y canal de venta (`POS`, `ECOMMERCE`, `AMBOS`).
  - Cupo máximo y vigencia temporal.
- **Archivos a inspeccionar:**
  1. [`apps/api/src/modules/descuentos/domain/discount-engine.service.ts`](file:///apps/api/src/modules/descuentos/domain/discount-engine.service.ts):
     - Evalúa la regla de mayor beneficio para el cliente o reglas acumulativas según la configuración.
  2. [`apps/admin/src/components/organisms/DiscountForm/DiscountForm.tsx`](file:///apps/admin/src/components/organisms/DiscountForm/DiscountForm.tsx):
     - Formulario administrativo de configuración de descuentos con selector de días y reglas.

---

### D. Ventas y Descuento Atómico de Inventario
- **Concepto:** Toda venta se procesa dentro de una transacción Prisma (`$transaction`). Si la venta incluye un combo, se descuenta el stock de cada producto componente según su receta; si incluye un producto con empaque (ej. Caja x 12), se multiplica la cantidad por el factor de empaque y se deduce del stock base.
- **Archivos a inspeccionar:**
  1. [`apps/api/src/modules/ventas/infrastructure/repositories/prisma-venta.repository.ts`](file:///apps/api/src/modules/ventas/infrastructure/repositories/prisma-venta.repository.ts):
     - Manejo de `SALIDA` atómica de inventario.
     - Registro en `MovimientosInventario` para auditoría completa y trazabilidad por usuario y documento de origen.

---

## 3. Checklist de Verificación en la iMac

Una vez clonado y levantado el entorno:

1. **Ejecutar Suite de Pruebas Automatizadas:**
   ```bash
   cd apps/api
   npm run test
   ```
   *Debe reportar 10 suites aprobadas y 79 tests en verde.*

2. **Verificar Build de Producción:**
   ```bash
   npm run build
   ```
   *Tanto `apps/api`, `apps/admin` como `apps/frontend` deben compilar sin errores de tipos TypeScript ni advertencias bloqueantes.*

3. **Verificar API Docs (Swagger):**
   - Abrir en el navegador: `http://localhost:3001/api/docs`
   - Validar endpoints de `/productos`, `/descuentos`, `/ventas`, `/inventario` y `/empaques`.
