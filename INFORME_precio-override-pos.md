# Informe de Implementación: Rebaja Manual de Precio en POS con Aprobación de Administrador

## 1. Resumen
Se implementó la funcionalidad de rebaja manual de precios en la pantalla de caja (`apps/admin/src/app/caja/page.tsx`). Cuando un ítem del carrito se vende por debajo de su precio de catálogo (resuelto jerárquicamente entre Empaque > Variante > Producto), el sistema exige en tiempo real las credenciales (email + contraseña) de un usuario con rol `Administrador` o `Super Usuario`. La autenticación y autorización se realiza server-side con `bcrypt` de manera atómica durante el registro de la venta, registrando la auditoría (`precio_unitario_catalogo`, `aprobado_por_usuario_id`, `motivo_ajuste`) en `VentaDetalle` sin modificar los precios maestros del catálogo.

## 2. Archivos modificados / creados

* `apps/api/prisma/schema.prisma`: Agregados los campos `precio_unitario_catalogo`, `aprobado_por_usuario_id` y `motivo_ajuste` en `VentaDetalle`, con la relación hacia `Usuario`.
* `apps/api/prisma/migrations/20260805143416_manual_price_override_venta_detalle/migration.sql`: Migración de base de datos para los nuevos campos y clave foránea de aprobación.
* `apps/api/src/modules/ventas/application/dtos/venta.dto.ts`: Agregados los campos opcionales `aprobador_email`, `aprobador_password`, `motivo_ajuste` en `RegistrarVentaDto` y `motivo_ajuste` en `VentaDetalleDto`.
* `apps/api/src/modules/ventas/domain/repositories/venta.repository.interface.ts`: Actualizados los tipos `VentaDetalleData` y `VentaCreateData` para soportar el flujo de aprobación y catálogo.
* `apps/api/src/modules/ventas/application/use-cases/registrar-venta.use-case.ts`: Transmisión de credenciales de aprobador y motivo desde el DTO al repositorio.
* `apps/api/src/modules/ventas/infrastructure/repositories/prisma-venta.repository.ts`: Lógica de resolución de precio de catálogo (Empaque > Variante > Producto), detección de rebajas, verificación `bcrypt` de credenciales y rol de Administrador/Super Usuario, y persistencia atómica en transacción.
* `apps/api/src/modules/ventas/infrastructure/repositories/prisma-venta.repository.spec.ts`: Suite de pruebas unitarias cubriendo escenarios sin rebaja, rebaja aprobada, credenciales faltantes, contraseña incorrecta y rol `Vendedor` rechazado.
* `apps/admin/src/app/caja/page.tsx`: UI de caja actualizada con input editable de precio por ítem, resumen de rebaja manual en totales, modal emergente de aprobación de administrador y renderizado de precio de catálogo tachado en comprobante de venta.

## 3. Decisiones de diseño y por qué

* **Verificación server-side en el mismo request de registro de venta:** Se optó por validar el email y la contraseña del aprobador directamente en el cuerpo del request `POST /api/ventas`. Esto garantiza atomicidad total: la transacción Prisma verifica credenciales y rol con `bcrypt`, valida stock/cupos y crea la venta en una única transacción atómica sin requerir tokens temporales ni estado persistido de sesión.
* **Separación entre Precio de Catálogo y Precio Aplicado:** `VentaDetalle.precio_unitario` se mantiene como el valor efectivamente cobrado (útil para reportes de caja, arqueos y comprobante), mientras que `precio_unitario_catalogo` almacena el valor oficial maestro al momento de la venta para auditar la brecha monetaria.
* **Manejo Semántico de Excepciones:** Se utiliza `BadRequestException` cuando faltan credenciales ante un intento de rebaja, y `UnauthorizedException` cuando las credenciales no pertenecen a un usuario activo o este no tiene rol `Administrador` / `Super Usuario`. Si la validación falla, se aborta la transacción sin tocar inventarios ni generar movimientos huérfanos.

## 4. Resultado de los tests

* **Comando ejecutado:** `pnpm --filter api test`
* **Resultado del runner:**
```text
> api@0.0.1 test /Users/axb/Entregas/apps/api
> jest

PASS src/modules/ventas/infrastructure/repositories/prisma-venta.repository.spec.ts
PASS src/modules/catalogo/application/use-cases/productos/crear-producto.use-case.spec.ts
PASS src/modules/descuentos/domain/discount-engine.service.spec.ts
PASS src/modules/descuentos/infrastructure/controllers/descuentos.controller.spec.ts
PASS src/modules/catalogo/infrastructure/repositories/prisma-producto.repository.spec.ts
PASS src/modules/catalogo/application/use-cases/productos/listar-productos.use-case.spec.ts
PASS src/modules/catalogo/application/use-cases/productos/actualizar-producto.use-case.spec.ts
PASS src/modules/catalogo/application/use-cases/productos/obtener-producto.use-case.spec.ts
PASS src/modules/catalogo/domain/combo-stock.spec.ts
PASS src/modules/catalogo/domain/combo-product.spec.ts

Test Suites: 10 passed, 10 total
Tests:       86 passed, 86 total
Snapshots:   0 total
Time:        1.505 s
Ran all test suites.
```

## 5. Cómo probarlo manualmente

### Flujo Feliz (Rebaja autorizada por Administrador)
1. Abrir la pantalla de caja en `http://localhost:3002/caja`.
2. Agregar un producto al carrito (ej. de Bs. 50.00).
3. En la tabla del carrito, cambiar el input de `P. Unit (Bs.)` a un valor menor (ej. Bs. 40.00). Notarás que el precio original se muestra tachado en gris y el subtotal se actualiza a Bs. 40.00.
4. Hacer clic en **COBRAR Bs. 40.00** y seleccionar **CONFIRMAR VENTA**.
5. El sistema detectará la rebaja y abrirá el modal **Autorización de Administrador**.
6. Ingresar las credenciales de un administrador (ej. Email: `admin@entregas.bo` o email del seed, Password: la contraseña correspondiente).
7. Hacer clic en **Autorizar y Continuar**. La venta se registrará correctamente y el comprobante mostrará el precio original tachado.

### Flujo de Rechazo (Credenciales inválidas o rol Vendedor)
1. Con un producto rebajado en el carrito, proceder al cobro y abrir el modal de autorización.
2. Ingresar una contraseña incorrecta o un email correspondiente a un usuario con rol `Vendedor`.
3. Hacer clic en **Autorizar y Continuar**.
4. El sistema mostrará una notificación toast de error (`Error: Credenciales de administrador inválidas` o `El usuario no posee permisos de Administrador...`) y **no** registrará la venta ni afectará los niveles de stock.

## 6. Limitaciones conocidas / pendientes

* **Sesión / Auth Global:** Dado que la aplicación no cuenta actualmente con middleware/guards globales de autenticación JWT (las ventas usan usuario hardcodeado por omisión), la aprobación se autentica en caliente por request mediante reingreso de credenciales de un administrador.
* **Límite Porcentual de Rebaja:** La aprobación por administrador permite cualquier precio `>= 0`. Si en el futuro se desea limitar el porcentaje máximo de descuento manual que un admin puede autorizar, se puede añadir una regla en el Use Case o en la entidad de configuración.
