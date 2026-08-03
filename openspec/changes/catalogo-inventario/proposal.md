# Proposal: Catálogo e Inventario

## Intent

Implementar el módulo principal de Catálogo e Inventario (Kardex) para el sistema ERP "Entregas". Este cambio habilitará la gestión centralizada de productos, sus variantes (presentaciones y empaques), su categorización (marcas, categorías) y el control estricto del stock mediante un registro inmutable de movimientos (Kardex).

## Scope

### In Scope
- API y UI para CRUD de Marcas y Categorías (con soporte de jerarquía de 1 nivel).
- API y UI para la gestión de Productos, incluyendo manejo de imágenes y metadatos (atributos JSONB).
- API y UI para Presentaciones de producto (multiplicadores de unidad y precios).
- Lógica de backend para consultar el stock (Inventario).
- API para registrar y auditar Movimientos de Inventario (Entradas, Salidas, Ajustes, Mermas).

### Out of Scope
- Funciones de carrito de compras o procesamiento de órdenes (pedidos).
- Gestión avanzada de proveedores y órdenes de compra.
- Devoluciones y compensaciones comerciales.

## Capabilities

### New Capabilities
- `catalogo-gestion`: CRUD de Marcas, Categorías, Productos, Imágenes y Presentaciones.
- `inventario-kardex`: Consulta de stock y registro inmutable de movimientos de inventario.

### Modified Capabilities
- None

## Approach

Se implementarán endpoints RESTful para cada entidad del catálogo. El inventario requerirá un cuidado especial para asegurar transacciones atómicas; todo cambio en `inventario.stock_actual` deberá ser acompañado por un registro en `movimientos_inventario` dentro de la misma transacción de base de datos para garantizar consistencia. La UI se construirá modularmente, permitiendo navegar la jerarquía de categorías y gestionar productos y su stock de manera intuitiva.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/api/catalogo` | New | Endpoints para gestionar marcas, categorías y productos |
| `backend/api/inventario` | New | Endpoints para consultar stock y movimientos |
| `frontend/admin/catalogo` | New | UI para administrar el catálogo |
| `frontend/admin/inventario` | New | UI para ver el Kardex y ajustar stock |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Inconsistencia de stock por concurrencia | High | Utilizar bloqueos de fila (`SELECT FOR UPDATE`) y transacciones estrictas al modificar el inventario y registrar movimientos. |
| Eliminación accidental de categorías con productos | Medium | Restricciones de clave foránea `RESTRICT` e implementación de validaciones amigables en UI antes de eliminar. |

## Rollback Plan

Revertir las migraciones de base de datos asociadas a las vistas y funciones de soporte de catálogo, y dar de baja los endpoints creados eliminándolos del router principal. En la UI, desactivar o eliminar las rutas del módulo en la barra de navegación administrativa.

## Dependencies

- La base de datos ya debe tener las tablas definidas en `der.sql`.
- El módulo de Autenticación y Autorización para proteger los endpoints (Usuarios, Roles, Permisos).

## Success Criteria

- [ ] Los administradores pueden crear, leer, actualizar y (si aplica) eliminar Marcas, Categorías y Productos.
- [ ] Los productos pueden tener múltiples Presentaciones y una galería de Imágenes.
- [ ] Las modificaciones de stock actualizan correctamente la tabla `inventario`.
- [ ] Cada cambio de stock genera automáticamente un registro preciso en `movimientos_inventario` (Kardex).


