eso # Design: Catálogo e Inventario

## Technical Approach

El módulo principal de Catálogo e Inventario será implementado siguiendo los principios de Clean Architecture ya establecidos en el backend (NestJS) y consumido por la interfaz de administración (Next.js). Se crearán dos dominios separados: `Catalogo` (gestión de marcas, categorías, productos, presentaciones) e `Inventario` (Kardex, consultas de stock y ajustes). El ORM Prisma se usará para persistencia. Las operaciones críticas de inventario aprovecharán transacciones interactivas de Prisma para garantizar atomicidad entre el cambio de stock y el registro en Kardex, cumpliendo con las validaciones a nivel de base de datos (`der.sql`).

## Architecture Decisions

### Decision: Separación de Dominios
**Choice**: Crear dos módulos separados en el backend: `CatalogoModule` e `InventarioModule`.
**Alternatives considered**: Crear un único módulo gigante que abarque productos y stock.
**Rationale**: Mantener responsabilidades separadas. El catálogo gestiona metadatos, jerarquías y variantes. El inventario tiene lógica transaccional estricta e inmutable para los movimientos.

### Decision: Control Transaccional en Inventario
**Choice**: Utilizar Interactive Transactions (`$transaction`) de Prisma en el repositorio de Inventario.
**Alternatives considered**: Usar Triggers en base de datos para generar el Kardex automáticamente.
**Rationale**: Mantener la lógica de negocio y auditoría en la capa de aplicación (Use Cases) facilita el testing, trazabilidad y manejo de errores (ej. captura del ID del usuario y tipo de documento de origen), a pesar de que la BD tiene restricciones fuertes para prevenir inconsistencias.

### Decision: Jerarquía de Categorías
**Choice**: Validar referencias circulares (autorreferencia) tanto en el Use Case como delegar el chequeo base en el constraint `ck_categorias_no_autorreferencia` de la BD.
**Alternatives considered**: Usar un árbol de cierre (closure table) o ltree de PostgreSQL.
**Rationale**: El requerimiento de jerarquía actual es simple (1 nivel de profundidad comúnmente, parent-child), un `categoria_padre_id` es suficiente sin sobreingeniería.

## Data Flow

Flujo de actualización de Inventario (Kardex):

```ascii
Admin UI ──(POST /api/inventario/movimientos)──→ InventarioController
                                                        │
                                                        ▼
                                            RegistrarMovimientoUseCase
                                                        │
                                                        ▼
                                           InventarioRepository (Prisma)
                                           ┌────────────┴────────────┐
                                           ▼ (Transaction)           ▼
                            UPDATE inventario             INSERT movimientos_inventario
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/api/src/modules/catalogo/catalogo.module.ts` | Create | Módulo de Catálogo (Marcas, Categorías, Productos, Presentaciones) |
| `apps/api/src/modules/catalogo/application/use-cases/productos/crear-producto.use-case.ts` | Create | Lógica para crear productos con atributos JSONB |
| `apps/api/src/modules/catalogo/infrastructure/repositories/prisma-producto.repository.ts` | Create | Implementación del repositorio de productos |
| `apps/api/src/modules/inventario/inventario.module.ts` | Create | Módulo de Inventario (Stock y Kardex) |
| `apps/api/src/modules/inventario/application/use-cases/movimientos/registrar-movimiento.use-case.ts` | Create | Lógica transaccional para asentar movimientos de inventario |
| `apps/api/src/modules/inventario/infrastructure/repositories/prisma-inventario.repository.ts` | Create | Repositorio que orquesta `$transaction` para Kardex y Stock |
| `apps/admin/src/app/(admin)/catalogo/page.tsx` | Create | UI principal del catálogo (Next.js) |
| `apps/admin/src/app/(admin)/inventario/page.tsx` | Create | UI principal del Kardex y control de stock |

## Interfaces / Contracts

```typescript
// DTOs para Creación de Movimiento de Inventario
export interface RegistrarMovimientoDto {
  productoId: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'MERMA';
  cantidadUnidadesBase: number;
  costoUnitarioSnapshot?: number;
  tipoDocumento?: 'ORDEN_COMPRA' | 'PEDIDO' | 'DEVOLUCION' | 'AJUSTE' | 'DONACION';
  documentoId?: number;
  observaciones?: string;
}

// Representación de Atributos del Producto (JSONB)
export interface ProductoAtributos {
  [key: string]: any;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Use Cases de Catalogo e Inventario | Mockear dependencias del repositorio. Validar lógica de precio promocional y reglas de negocio. |
| Integration | PrismaRepositories | Testcontainers o BD de test. Validar que la inserción de Kardex y actualización de stock ocurren atómicamente y respetan las restricciones de DB (stock no negativo). |
| E2E | Endpoints API | Peticiones HTTP a `/api/catalogo/*` y `/api/inventario/*` validando códigos de estado y payloads de respuesta. |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. La base de datos ya cuenta con las estructuras en `der.sql`.

### Decision: Almacenamiento de Imágenes
**Choice**: Sistema de archivos local del VPS (`public/uploads`) expuesto estáticamente vía NestJS.
**Alternatives considered**: Object Storage en la nube (AWS S3, OVH, Cloudflare R2).
**Rationale**: Para el volumen esperado (~1000 imágenes de bajo peso), el almacenamiento local es suficiente (menos de 500MB). Evita la complejidad infraestructural de integrar servicios de terceros en la primera etapa. El riesgo de pérdida de datos se asume con políticas de backups (snapshots) del servidor.

### Decision: Concurrencia de Inventario
**Choice**: PostgreSQL Row-Level Locks (`SELECT FOR UPDATE`).
**Alternatives considered**: Cache distribuida con locks en Redis.
**Rationale**: PostgreSQL es más que capaz de manejar picos de concurrencia de una PyME o tienda escolar sin necesidad de agregar la complejidad de mantener un servidor Redis adicional. Mantiene la infraestructura simple y fácil de operar.
