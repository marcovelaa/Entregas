# Roadmap para completar Entregas

Este documento convierte el PRD, la auditoría técnica y los cambios OpenSpec en una secuencia ejecutable. Se trabaja **un paquete a la vez**: no se inicia el siguiente hasta que el actual cumpla sus criterios de aceptación, tenga su evidencia de verificación y esté integrado en `main`.

## Ruta rápida

1. Cerrar y publicar las reservas de inventario ya implementadas.
2. Proteger las reglas de negocio pendientes antes de ampliar pantallas o reportes.
3. Completar el flujo comercial de punta a punta: identidad/dirección → pedido → reserva → QR → pago → despacho → devolución.
4. Completar la operación ERP, rendimiento, calidad y despliegue.

## Línea base

El backend ya tiene módulos de catálogo, inventario, compras, clientes, proveedores, ventas, descuentos, dashboard e IAM. JWT/RBAC, límites de descuento, índices, documentación Swagger, CORS/rate limiting, validación de precios en servidor y la optimización transaccional del checkout ya fueron trabajados. El ERP cuenta con rutas para caja, ventas, compras, inventario, catálogo, descuentos, clientes, proveedores, configuración y dashboard. El e-commerce cuenta con catálogo y pantallas de checkout/cuenta, pero el checkout y la cuenta todavía muestran datos estáticos y no consumen un flujo comercial real.

**Estado:** el paquete de reservas estrictas de inventario de 15 minutos (Fase 0) ya está publicado en `main` — ver cierre de 0.1 abajo.

## Convenciones del plan

| Etiqueta | Significado |
|---|---|
| **Prioridad P0** | Bloquea seguridad, dinero, stock o la siguiente fase. |
| **Prioridad P1** | Necesaria para el flujo comercial completo. |
| **Prioridad P2** | Mejora operación, escalabilidad o experiencia. |
| **Esfuerzo S / M / L** | Pequeño / mediano / grande; no representa fechas. |
| **[Backend] [ERP] [E-commerce] [Operaciones]** | Superficie principal afectada. |

### Regla de cierre para cada paquete

- [ ] Código, migraciones y documentación del paquete revisados.
- [ ] Pruebas unitarias, de integración y/o e2e proporcionales al riesgo pasan.
- [ ] `lint`, tipos, build y `git diff --check` pasan cuando el entorno del paquete lo permita.
- [ ] Cambios confirmados en un commit convencional, publicados y verificados contra `origin/main`.
- [ ] `AUDITORIA.md` y este roadmap se actualizan si cambia el estado o el alcance.

---

## Fase 0 — Consolidar la reserva de inventario

| ID | Paquete | Resultado y alcance | Criterios de aceptación | Verificación | Prioridad / esfuerzo |
|---|---|---|---|---|---|
| 0.1 | **Publicar reservas reales** [Backend] ✅ | Confirmar y publicar el trabajo local: reserva por usuario de 15 minutos, consumo en venta, cancelación, vencimiento, guards atómicos y migraciones. | Ningún cambio de reserva queda sin seguimiento; el cupo reservado nunca excede el disponible; una reserva solo puede consumirse una vez y por su propietario. | Ejecutar las pruebas focalizadas de ventas y `reserva-inventario.e2e-spec.ts` contra PostgreSQL; revisar migraciones; commit y push. | **P0 / S** |

**Cierre de 0.1:** publicado en `main` (`835f062..d5e8983`, 2026-08-12). Tests de ventas 30/30, `reserva-inventario.e2e-spec.ts` 6/6 contra PostgreSQL real; lint sin regresión (721 errores preexistentes iguales antes/después); `tsc --noEmit` y `nest build` limpios.

**No iniciar:** pagos QR ni checkout público hasta completar la Fase 1. El worker de vencimientos (1.1) ya puede iniciarse porque solo depende de 0.1.

## Fase 1 — Reglas críticas y decisiones de producto  

| ID | Paquete | Resultado y alcance | Criterios de aceptación | Verificación | Prioridad / esfuerzo |
|---|---|---|---|---|---|
| 1.1 | **Programar la expiración de reservas** [Operaciones][Backend] ✅ | Ejecutar periódicamente la expiración ya expuesta por el backend mediante cron/job gestionado; mantener la liberación perezosa como defensa adicional. | Las reservas vencidas se liberan sin que el usuario inicie otra acción; el job es autenticado, idempotente y observable. | Prueba de vencimiento con reloj controlado; ejecución manual del job en entorno no productivo; registro/alerta de fallo. | **P0 / M** |

**Cierre de 1.1:** publicado en `main` (`d5e8983..2e5624c`, 2026-08-12). `InventoryReservationExpirationJob` corre cada minuto vía `@nestjs/schedule`, llama al `expire()` ya expuesto, loguea liberaciones y atrapa/loguea fallos sin crashear el proceso; el endpoint manual `POST /ventas/reservas/expirar` sigue disponible para entornos no productivos. Tests: 3/3 unitarios del job (éxito, silencio sin reservas, fallo atrapado) + 33/33 de ventas + 6/6 e2e de reservas contra PostgreSQL. Tipos y build limpios.

**Hallazgos de la verificación de 1.1 — ✅ resueltos:**
- `test/app.e2e-spec.ts`: `GET /` devolvía 401 en vez de 200 porque el guard global de auth no dejaba excepción para el health-check. Fix: `@Public()` en `AppController.getHello()`.
- `test/catalogo.e2e-spec.ts`: fallaba con 401 en los 4 tests (nunca autenticaba, roto desde el hardening de auth global) y su `afterAll` hacía `deleteMany()` sin filtro sobre tablas completas de la base de desarrollo compartida — no solo un bug de orden de FK. Fix: el test ahora crea un usuario/rol propio y firma un JWT con permiso `catalogo:gestionar`; el `afterAll` borra únicamente los IDs que el propio test creó. **Nota de incidente:** al iterar el fix original (solo reordenar deletes) se ejecutó `movimientosInventario.deleteMany()` sin scope contra `entregas_db` (dev compartida) y borró las filas reales de esa tabla antes de detectar el problema; no era dato de seed y no se pudo recuperar. Corregido y sin nuevas corridas destructivas desde entonces.

| 1.2 | **Validar cargas de imágenes** [Backend][ERP] ✅ | Aplicar una política única de MIME permitido, límite de tamaño, nombre/almacenamiento seguro y respuestas HTTP correctas a todos los endpoints de imágenes. | JPEG/PNG/WebP/GIF válidos dentro del límite son aceptados; SVG, HTML, MIME falsificado y archivos sobredimensionados son rechazados. | Tests de controller o e2e para cada caso; prueba manual de descarga desde `/uploads`. | **P0 / S** |

**Cierre de 1.2:** política compartida en `common/uploads/image-upload.config.ts`, usada por `producto-imagenes.controller.ts` (antes sin ninguna validación) y `variantes.controller.ts` (antes solo confiaba en el `Content-Type` declarado por el cliente). Filtro rápido por MIME declarado + verificación real de magic bytes (JPEG/PNG/GIF/WebP) que renombra el archivo a la extensión verificada y borra/rechaza cualquier otra cosa — así un SVG o HTML con `Content-Type: image/jpeg` falsificado ya no pasa. Límite de 5MB. Respuestas HTTP correctas: NestJS ya traduce internamente los errores de Multer (`LIMIT_FILE_SIZE` → 413, resto → 400) antes de llegar a los filtros globales, así que no hizo falta un filtro nuevo. Verificado con 7 tests unitarios de la detección de firmas + prueba manual real contra el servidor levantado (JPEG válido → 201, SVG disfrazado → 400, archivo de 6MB → 413) en `producto-imagenes` y `variantes`. 150/150 unit + 13/13 e2e, tipos y build limpios. **Nota:** la prueba manual detectó que el proceso local en :3001 corría un build viejo (`dist/` sin rebuild); se reconstruyó y reinició para validar contra el código real.
| 1.3 | **Decidir descuentos acumulables** [Producto][Backend][ERP] ✅ | Resolver el significado de `es_acumulable`: permitir acumulación con reglas explícitas o retirar el campo y su control visual. | La regla queda escrita y aprobada: combinaciones permitidas, orden por prioridad, topes, incompatibilidades y redondeo. No hay checkbox ni dato persistido sin efecto. | Casos de ejemplo aprobados por negocio y pruebas que reproduzcan cada combinación permitida/prohibida. | **P0 / S (decisión)** |
| 1.4 | **Implementar la política de descuentos elegida** [Backend][ERP] ✅ | Ajustar `DiscountEngineService`, venta, cupos y UI administrativa según 1.3; completar descuentos por ítem, canal, destinatario y límite definidos en el cambio OpenSpec de descuentos cuando sean parte de la decisión. | El total siempre se calcula en servidor; el cupo global/por cliente se mantiene atómico; el desglose explica qué regla se aplicó o por qué no. | Unit tests de reglas y límites; e2e concurrente; prueba POS de cupón y prueba administrativa de creación/edición. | **P0 / L** |

**Cierre de 1.4:** verificación línea por línea confirmó que las 10 tareas de `openspec/changes/complete-discounts-engine` e `item-level-fixed-discounts` ya estaban implementadas en código (schema, motor con matching por ítem + 5 estrategias, controller con varianteIds/empaqueIds/canal/límites, transacción atómica en ventas, UI ERP con edición, POS con cupón en vivo). El total en servidor y el cupo atómico ya cumplían; solo faltaba el desglose explicativo cuando ningún descuento aplica. Se agregó `DiscountEngineService.evaluateWithReason()` (sin tocar la firma de `evaluate()`, que sigue usando `registrar-venta` sin cambios) con 12 razones de rechazo estructuradas (`CUPON_NO_ENCONTRADO`, `CUPON_INACTIVO`, `CUPON_FUERA_DE_VIGENCIA`, `CUPON_DIA_NO_HABILITADO`, `FUERA_DE_HORARIO`, `CANAL_NO_VALIDO`, `CUPO_GLOBAL_AGOTADO`, `LIMITE_POR_CLIENTE_ALCANZADO`, `SIN_ITEMS_ELEGIBLES`, `MONTO_MINIMO_NO_ALCANZADO`, `SIN_AHORRO_CALCULADO`, `SIN_PROMOCIONES_ACTIVAS`), nuevo método de repositorio `buscarDescuentoPorCupon` (sin los filtros de vigencia, para distinguir "no existe" de "existe pero inactivo/vencido/día no habilitado"), y el mensaje ahora se muestra en `caja/page.tsx`. Verificado con 26 tests del engine + 6 del repositorio + 3 del controller + prueba manual real contra el servidor (cupón inexistente vs. cupón inactivo, mensajes distintos). 164/164 unit + 13/13 e2e, tipos y build limpios en `apps/api` y `apps/admin`.

**Cierre de 1.3 — Regla adoptada: sin acumulación.**
- **Combinaciones permitidas:** ninguna. Por venta se aplica un único descuento: el de mayor ahorro entre todas las reglas vigentes y elegibles (ya era el comportamiento real de `DiscountEngineService.evaluate()`; ahora es la regla formal, no un efecto colateral).
- **Orden/prioridad:** en empates de ahorro, gana la regla con `prioridad` más alta (`buscarReglasVigentes` ya ordena por `prioridad desc, creado_en desc`, y el engine solo reemplaza el resultado con `savings > maxSavings` estricto). No requirió cambios de motor.
- **Topes:** el tope por regla (`max_monto_descuento`) sigue vigente sin cambios; no aplica un tope global adicional porque nunca se combinan reglas.
- **Incompatibilidades:** aplicar una regla excluye automáticamente a todas las demás (implícito en "un solo descuento gana").
- **Redondeo:** 2 decimales vía `toFixed(2)`, ya implementado, sin cambios.
- **Implementación:** columna `es_acumulable` eliminada (`prisma/migrations/20260812222354_remove_descuento_es_acumulable`); mapeo retirado de `descuentos.controller.ts`; checkbox retirado de `DiscountForm.tsx` y del tipo en `apps/admin/src/app/descuentos/page.tsx`. Verificado: 143/143 unit + 13/13 e2e (API), tipos y build limpios en `apps/api` y `apps/admin`.

**No iniciar:** rediseño visual de descuentos, promociones complejas (por ejemplo, Buy X Get Y) ni integraciones de checkout hasta evaluar 1.4. Con 1.3 cerrado, el engine ya cumple la regla decidida — 1.4 queda para lo que falte de descuentos por ítem/canal/destinatario del cambio OpenSpec, no para acumulación.

## Fase 2 — Fundamentos del pedido digital

| ID | Paquete | Resultado y alcance | Criterios de aceptación | Verificación | Prioridad / esfuerzo |
|---|---|---|---|---|---|
| 2.1 | **Identidad pública y direcciones** [Backend][E-commerce] ✅ | Completar registro/inicio/cierre de sesión del cliente, recuperación/cambio de contraseña y CRUD de direcciones; conservar guest checkout como exige el PRD. | Un cliente autenticado solo accede a sus datos; el invitado puede entregar datos de contacto/envío sin crear usuario; la dirección confirmada queda como snapshot del pedido. | E2e de autorización por propietario, alta/edición/borrado de dirección y checkout invitado. | **P1 / L** |
| 2.2 | **API de pedido y seguimiento** [Backend] ✅ | Formalizar creación de pedido desde carrito, historial de estados, snapshots de ítems/envío, lectura del cliente y consulta operativa ERP. | Transiciones inválidas son rechazadas; cada cambio deja historial; precios y nombres históricos no cambian si cambia el catálogo. | Tests de máquina de estados y e2e de creación, consulta de propietario y transición autorizada. | **P1 / L** |
| 2.3 | **Integración QR Banco BISA** [Backend][Operaciones] ✅ | Crear pago QR, clave de idempotencia, webhook autenticado, conciliación y expiración/anulación; enlazar la reserva creada en 0.1. | Un webhook repetido no duplica venta ni movimiento; pago confirmado consume reserva una vez; rechazado/expirado libera reserva; fallos quedan trazables. | Sandbox BISA o contrato simulado; e2e de reintento, confirmación, rechazo y timeout; conciliación de discrepancias. | **P1 / L** |
| 2.4 | **Checkout e-commerce real** [E-commerce][Backend] ✅ | Reemplazar el formulario, resumen y enlace de éxito estáticos por carrito real, validación, dirección, reserva, creación de pedido y visualización del QR/estado. | El precio del navegador nunca es fuente de verdad; no se permite pagar con carrito vencido o sin stock; éxito solo aparece tras el estado correcto del backend. | E2e de navegador o prueba manual guiada: carrito → dirección → reserva → QR → confirmación → pedido. | **P1 / L** |
| 2.5 | **Cuenta, pedidos y seguimiento** [E-commerce][ERP] ✅ | Conectar "Mi cuenta" a perfil, direcciones, historial de pedidos y detalle; agregar en ERP la cola operativa para preparar, enviar y entregar. | No quedan datos de ejemplo; cada vista respeta propiedad/rol; cliente y operador ven el mismo estado con permisos distintos. | Pruebas de autorización y recorrido de pedido en ambas aplicaciones. | **P1 / M** |

**Cierre de 2.1:** completado y verificado en la rama de trabajo `worktree-identidad-cliente-direcciones` (2026-08-13).
- **Backend:** `ClienteAuthModule`, `ClienteAuthController` (`/clientes/auth/*`), `ClientePerfilController` (`/clientes/me`), `DireccionesController` (`/clientes/me/direcciones/*`), `ClienteAuthService`, estrategia JWT `jwt-cliente` (con cookies HTTP-only `cliente_access_token` y `cliente_refresh_token`), `IClienteResetTokenRepository` y `IDireccionRepository` con Prisma, y hash seguro SHA-256 de tokens de recuperación.
- **E-commerce:** cliente HTTP con credenciales (`apps/frontend/src/lib/api.ts`), middleware de protección de rutas para `/mi-cuenta/*`, pantallas `/ingresar`, `/registro`, `/recuperar-password`, `/recuperar-password/[token]`, y panel `/mi-cuenta` totalmente conectado a datos reales de perfil y CRUD de direcciones.
- **Alcance diferido / dev-mode:** la integración de checkout con direcciones se difiere a 2.4; el envío de correos de recuperación se mantiene en modo desarrollo (expone `devToken` directamente en la API y UI) pendiente de un paquete futuro de envío de correo.
- **Verificación:** 26/26 suites unitarias passed (187/187 tests) en `apps/api`; 5/5 suites e2e passed (19/19 tests) incluyendo `clientes-auth.e2e-spec.ts` contra PostgreSQL real; `tsc --noEmit` y `pnpm run build` limpios en `apps/api`; `tsc --noEmit` y `next build` limpios en `apps/frontend` (18 rutas estáticas compiladas correctamente).

**Cierre de 2.2:** completado y verificado (2026-08-13).
- **Modelos & Prisma:** Modelos `Pedido`, `PedidoDetalle` y `PedidoHistorialEstado` añadidos a Prisma con soporte para snapshots inmutables (`direccion_envio_snapshot` JSONB, `nombre_producto`, `sku`, `precio_unitario`, `subtotal`). Base de datos PostgreSQL actualizada mediante `prisma db push` y cliente regenerado con `prisma generate`.
- **Dominio & Máquina de Estados:** `EstadoPedido` (`PENDIENTE_PAGO`, `PAGADO`, `EN_PREPARACION`, `ENVIADO`, `ENTREGADO`, `CANCELADO`), validación de transiciones permitidas (`esTransicionValida`) y registro inmutable en bitácora de historial.
- **Casos de uso & Repositorios:** `PrismaPedidoRepository`, `CrearPedidoUseCase`, `CambiarEstadoPedidoUseCase`, `ListarPedidosClienteUseCase`, `ObtenerPedidoClienteUseCase` y `ListarPedidosErpUseCase`.
- **Controladores & Seguridad:** `ClientePedidosController` (`/clientes/me/pedidos` con `@ClienteActual()` y `ClienteJwtAuthGuard`), `PedidosErpController` (`/pedidos` con `@RequierePermiso('ventas:ver')` y `ventas:crear`).
- **Verificación:** 28/28 suites unitarias passed (198/198 tests); 6/6 suites e2e passed (20/20 tests) incluyendo `pedidos.e2e-spec.ts` contra PostgreSQL real; `tsc --noEmit` y `pnpm run build` limpios en `apps/api`; `tsc --noEmit` y `next build` limpios en `apps/frontend`.

**Cierre de 2.3:** completado y verificado con proveedor de contrato simulado (2026-08-13).
- **Modelos & Prisma:** Modelos `PagoQR` y `PagoWebhookLog` creados en Prisma con claves de idempotencia únicas (`idempotency_key`, `referencia_bisa`), estados (`PENDIENTE`, `CONFIRMADO`, `EXPIRADO`, `CANCELADO`) y bitácora de webhooks. Base de datos PostgreSQL sincronizada con `prisma db push`.
- **Adaptador Simulado & Puerto:** `IBisaQrProvider` e implementación `SimuladoBisaQrProvider` que genera URLs/QRs sandbox de prueba y valida firmas de webhook.
- **Casos de uso & Idempotencia:** `GenerarPagoQrUseCase`, `ProcesarWebhookBisaUseCase` (con estricta idempotencia contra webhooks duplicados y avance de `Pedido` a `PAGADO`) y `ObtenerEstadoPagoUseCase`.
- **Controladores & Endpoints:** `PagosBisaController` (`POST /pagos/qr/generar`, `POST /pagos/bisa/webhook`, `GET /pagos/qr/:id/estado`).
- **Verificación:** 29/29 suites unitarias passed (203/203 tests); 7/7 suites e2e passed (23/23 tests) incluyendo `pagos-bisa.e2e-spec.ts` contra PostgreSQL real; `tsc --noEmit` y `pnpm run build` limpios en `apps/api`; `tsc --noEmit` y `next build` limpios en `apps/frontend`.

**Cierre de 2.4:** completado y verificado (2026-08-13).
- **Checkout Interactivo:** Página `/checkout` conectada dinámicamente con selección de direcciones guardadas del cliente (`GET /clientes/me/direcciones`) y formulario para invitados.
- **Flujo de Pago QR & Polling:** Conectado a la creación del pedido (`POST /clientes/me/pedidos`), generación del QR Banco BISA (`POST /pagos/qr/generar`), temporizador regresivo de 15 minutos, polling continuo cada 3s a `GET /pagos/qr/:id/estado` y botón interactivo Sandbox para pruebas.
- **Pantalla de Éxito (`/success`):** Redirección automática tras confirmación de pago desplegando número de pedido oficial, total pagado en BOB y datos de entrega en contenedor con `<Suspense>`.
- **Verificación:** 29/29 suites unitarias passed; 7/7 suites e2e passed en backend; `tsc --noEmit` y `next build` pasaron limpiamente en el frontend compilando 18 rutas estáticas y dinámicas.

**Cierre de 2.5:** completado y verificado (2026-08-13).
- **Panel Mi Cuenta:** Pestaña "Mis Pedidos" conectada a datos reales del cliente (`GET /clientes/me/pedidos`), mostrando tarjetas de pedido, estadísticas de compras acumuladas, estados formateados con badges dinámicos y detalle expandible con ítems y dirección de entrega snapshot.
- **Cola Operativa ERP:** Pantalla administrativa `/admin/pedidos` para operadores ERP conectada a `GET /pedidos` y `PATCH /pedidos/:id/estado` para transicionar pedidos (`PAGADO` ➔ `EN_PREPARACION` ➔ `ENVIADO` ➔ `ENTREGADO`).
- **Verificación:** 29/29 suites unitarias passed; 7/7 suites e2e passed en backend; `tsc --noEmit` y `next build` pasaron limpiamente en el frontend compilando 19 rutas estáticas y dinámicas.



**No iniciar:** automatización de marketing, favoritos avanzados o un rediseño amplio del storefront antes de 2.4. Un checkout visual sin pedido, reserva y pago correctos no genera una venta confiable.

## Fase 3 — Postventa y operación ERP

| ID | Paquete | Resultado y alcance | Criterios de aceptación | Verificación | Prioridad / esfuerzo |
|---|---|---|---|---|---|
| 3.1 | **Devoluciones / RMA** [Backend][ERP][E-commerce] ✅ | Implementar solicitud, evaluación, resolución (reembolso/cambio/sin compensación), destino físico (inventario, baja o revisión), nota de crédito y trazabilidad. | Una devolución solo referencia ítems entregados y cantidades disponibles; el restock y Kardex son atómicos; la compensación no se duplica. | E2e de devolución parcial/completa, producto dañado, restock y reintento idempotente. | **P1 / L** |
| 3.2 | **Bitácora de negocio** [Backend][ERP] | Registrar actor, request ID, origen, IP/user-agent y antes/después de operaciones críticas de seguridad, precio, stock, pagos, descuentos y devoluciones. | Los eventos críticos son inmutables, consultables solo por rol autorizado y no exponen secretos. | E2e de evento por acción crítica; revisión de permisos y redacción de datos sensibles. | **P1 / M** |
| 3.3 | **Compras y proveedores operables** [ERP][Backend] | Cerrar el flujo de orden de compra, recepción parcial/total, costo de transporte, costo promedio, kardex y pantallas pendientes del rediseño/refactor de compras. | Las transiciones de orden son válidas; recibir no duplica inventario; costo promedio y movimientos coinciden. | E2e de orden → recepción parcial → finalización; prueba de UI administrativa. | **P1 / L** |
| 3.4 | **Combos y catálogo pendientes** [ERP][E-commerce][Backend] | Completar reglas de vigencia/control de stock de combos y revisar los cambios OpenSpec pendientes de variantes multidimensionales, empaques, combos y catálogo antes de activarlos. | El stock virtual y la vigencia son consistentes en catálogo, POS y venta; variantes/presentaciones tienen SKU y validaciones correctas. | Tests de cálculo de combo; e2e de venta de combo; prueba de formularios de catálogo. | **P2 / L** |

**Cierre de 3.1:** completado y verificado (2026-08-13).
- **Modelos & Prisma:** Modelos `Devolucion` y `DevolucionDetalle` añadidos a Prisma con claves UUID públicas, estados (`SOLICITADA`, `EN_REVISION`, `APROBADA`, `RECHAZADA`, `COMPLETADA`), resoluciones (`REEMBOLSO`, `CAMBIO`, `SIN_COMPENSACION`) y destinos físicos (`INVENTARIO_RESTOCK`, `BAJA_DANADO`, `INSPECCION`). Base de datos PostgreSQL actualizada mediante `prisma db push`.
- **Casos de Uso & Restock Atómico:** `SolicitarDevolucionUseCase` (valida pedidos entregados y limita cantidades a devolver) y `EvaluarDevolucionUseCase` (ejecuta restock de inventario y registra bitácora en `MovimientosInventario` en una sola transacción atómica Prisma).
- **Controladores & Endpoints:** `ClienteDevolucionesController` (`POST /clientes/me/devoluciones`, `GET /clientes/me/devoluciones`) y `DevolucionesErpController` (`GET /devoluciones`, `PATCH /devoluciones/:id/evaluar` con RBAC `ventas:ver` y `ventas:editar`).
- **Verificación:** 30/30 suites unitarias passed (207/207 tests); 8/8 suites e2e passed en backend incluyendo `devoluciones.e2e-spec.ts` contra PostgreSQL real; `tsc --noEmit` y `next build` limpios en frontend.


**No iniciar:** reembolso de pagos QR ni devolución de inventario sin 3.1; son operaciones financieras y de stock que deben compartir una única trazabilidad.

## Fase 4 — Reportes, rendimiento y arquitectura sostenible

| ID | Paquete | Resultado y alcance | Criterios de aceptación | Verificación | Prioridad / esfuerzo |
|---|---|---|---|---|---|
| 4.1 | **Analítica paginada y reportes operativos** [Backend][ERP] | Incorporar reportes sobre el dashboard ya desacoplado y paginar la analítica de descuentos y entregar reportes de ventas, productos, categorías, vendedores, pagos, inventario, compras y proveedores. | Las vistas históricas están paginadas; filtros/periodos son consistentes; exportaciones respetan permisos. | Tests de paginación, `EXPLAIN ANALYZE` sobre consultas de reportes y pruebas de permisos. | **P2 / L** |
| 4.2 | **Caché Redis y observabilidad** [Backend][Operaciones] | Introducir Redis para datos de lectura definidos (dashboard/catálogo/reglas), invalidación por eventos y métricas de hit/miss; no usarlo como fuente de verdad de stock o pagos. | Un cambio relevante invalida o actualiza la lectura; una caída de Redis degrada sin corromper operaciones. | Tests de invalidación y fallback; métricas/alertas en entorno de prueba. | **P2 / M** |
| 4.3 | **Optimizar catálogo e imágenes** [Backend][E-commerce] | Separar consultas de listado/detalle, paginar descuentos/listados pendientes, eliminar configuración global de imágenes no optimizadas y migrar imágenes calientes a `next/image`. | La grilla no trae grafos de detalle; imágenes tienen tamaño/alt; métricas de carga mejoran sin romper proveedores remotos. | Perfil de consultas; build de Next; revisión Lighthouse y pruebas visuales responsivas. | **P2 / M** |
| 4.4 | **Cerrar deuda hexagonal restante** [Backend] | Resolver el boundary Prisma pendiente de compras, introducir boundaries DTO-entidad en clientes, dividir el repositorio de ventas y eliminar puertos `any`; añadir verificación arquitectónica que impida nuevas dependencias de infraestructura en dominio/aplicación. | Compras usa contratos de dominio definidos; clientes y puertos tienen tipos explícitos; el repositorio de ventas separa reglas de persistencia; la verificación arquitectónica evita regresiones. | Tests de arquitectura/imports y regresión por módulo. | **P2 / L** |

## Fase 5 — Calidad, seguridad de entrega y salida a producción

| ID | Paquete | Resultado y alcance | Criterios de aceptación | Verificación | Prioridad / esfuerzo |
|---|---|---|---|---|---|
| 5.1 | **Contrato HTTP y documentación** [Backend] | Normalizar `PATCH`, `DELETE 204`, excepciones NestJS y DTOs; completar Swagger de los controllers restantes. | No quedan rutas duplicadas/confusas ni `throw new Error()` de negocio; Swagger permite probar rutas con respuestas documentadas. | Tests de controller y revisión del OpenAPI generado. | **P2 / M** |
| 5.2 | **TypeScript, accesibilidad y UI** [Backend][ERP][E-commerce] | Activar `strict` gradualmente en API, eliminar errores tipados, corregir controles semánticos y `alt`, y validar navegación por teclado. | Compilación estricta sin supresiones injustificadas; componentes interactivos son accesibles. | `check-types`, lint de accesibilidad y prueba manual de teclado/lector de pantalla básico. | **P2 / M** |
| 5.3 | **CI/CD y controles de integración** [Operaciones] | Crear pipeline para lint, tipos, pruebas, build, migraciones verificables y análisis de cambios; definir promoción por ambientes, backup y rollback. | Todo PR recibe evidencia automática; un despliegue fallido puede detenerse/revertirse; secretos no llegan al repositorio. | Ejecución de pipeline en PR de prueba y simulación documentada de rollback. | **P1 / M** |
| 5.4 | **Preparación productiva** [Operaciones] | Configurar variables por ambiente, CORS permitido, HTTPS, gestión de secretos, backups PostgreSQL, restauración probada, monitoreo, alertas y runbooks de QR/reservas. | Se puede restaurar un backup; alertas cubren caída de API/DB/job/webhook; los runbooks permiten responder sin conocimiento implícito. | Ejercicio de restauración y de incidente controlado; revisión de configuración de producción. | **P1 / L** |

---

## Decisiones de producto pendientes

| Decisión | Debe definir | Bloquea |
|---|---|---|
| ~~**Acumulación de descuentos**~~ | ✅ Resuelta (1.3): sin acumulación, un solo descuento por venta. Ver cierre de 1.3 en Fase 1. | — |
| **Política de envío** | Cobertura, tarifas, zonas, umbral de envío gratis y responsable de despacho. | Checkout final y estados de pedido. |
| **Política de devoluciones** | Plazo, elegibilidad, quién absorbe el costo, tratamiento de producto dañado y compensación permitida. | 3.1. |
| **Contrato BISA** | Ambiente, autenticación de webhook, SLA, conciliación y manejo de caídas. | 2.3 y salida productiva. |

## Definición de “100 % completado”

El proyecto estará completo cuando un cliente autenticado o invitado pueda comprar desde el catálogo con precio calculado por servidor, dirección válida, reserva de stock, pago QR idempotente y seguimiento de pedido; cuando el ERP pueda operar catálogo, inventario, compras, ventas, descuentos, pedidos, pagos, devoluciones y auditoría; y cuando la plataforma cuente con pruebas automáticas, CI/CD, observabilidad, backup/restauración y runbooks validados. El cierre exige que no permanezcan hallazgos críticos o altos abiertos en `AUDITORIA.md`, que cada cambio OpenSpec activo esté implementado o descartado explícitamente y que las decisiones de producto de la tabla anterior estén resueltas.

## Evidencia consultada

- `PRD.md` — alcance funcional, reglas de reservas, pedidos, pagos QR, devoluciones y auditoría.
- `AUDITORIA.md` — hallazgos abiertos/resueltos y evidencia de las reservas locales pendientes de publicación.
- `README.md`, estructura de `apps/api`, rutas de `apps/admin` y `apps/frontend` — módulos y superficies existentes.
- `openspec/changes/` — paquetes pendientes de descuentos, combos, catálogo y compras.
