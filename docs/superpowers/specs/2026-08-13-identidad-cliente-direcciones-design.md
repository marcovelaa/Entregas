# Diseño: 2.1 Identidad pública y direcciones

**Paquete del roadmap:** `ROADMAP_COMPLETAR_PROYECTO.md` → Fase 2, ítem 2.1 (P1/L).
**Fecha:** 2026-08-13.

## Alcance

Incluye:
- Módulo de identidad de cliente: registro, login, logout, recuperación de contraseña (sin envío de email real), cambio de contraseña autenticado.
- CRUD de Direcciones por cliente.
- Conexión de `apps/frontend/src/app/mi-cuenta/page.tsx` (hoy 100% estático) a este backend real: tabs Perfil y Direcciones.

No incluye (se resuelve en paquetes posteriores del roadmap):
- Conectar `apps/frontend/src/app/checkout/page.tsx` al flujo de identidad/direcciones — eso es 2.4, que depende de 2.2 (pedidos) y 2.3 (pago QR). El checkout invitado sigue igual que hoy, sin tocarse.
- Envío real de emails de recuperación — queda como paquete aparte. En 2.1, el token de recuperación se devuelve en la respuesta del endpoint solo cuando `NODE_ENV !== 'production'` (mismo criterio que el endpoint manual de reservas de 1.1).
- Historial de pedidos en `mi-cuenta` (tabs Resumen/Pedidos) — pasan a un estado vacío honesto; el dato real llega con 2.2/2.5.

## Decisión de arquitectura: identidad de cliente separada de IAM

`Usuario`/`Rol`/RBAC (`apps/api/src/modules/iam`) es exclusivamente para staff: cada `Usuario` tiene `rolId` y `permisos`. Mezclar clientes ahí acoplaría dos dominios de tamaño y sensibilidad muy distintos (miles de clientes vs. pocos empleados) al mismo sistema de permisos administrativos.

Se opta por una identidad de cliente **completamente separada**:
- `Cliente` (schema.prisma:371) suma `password_hash: String?` (nullable — un `Cliente` creado desde POS sin cuenta sigue sin password).
- Nuevo `ClienteAuthService` con JWT propio (`CUSTOMER_JWT_SECRET`, distinto al de staff) y guard propio, sin tocar `AuthService`/`Usuario`/`Rol`.
- Sesión vía **cookie httpOnly + Secure + SameSite** (no localStorage). El backend ya tiene `cookie-parser` y CORS con `credentials: true` (`apps/api/src/main.ts:42,58`), aunque el login de staff hoy no los usa. JS del frontend nunca toca el token, así que un XSS en el sitio público no puede robarlo.

## Modelo de datos

```
Cliente (existente, + password_hash String? @db.Text)
  id, nombre, documento_id?, email?, telefono?, direccion? (texto libre existente, sin tocar),
  password_hash?, activo, creado_en, actualizado_en
  → direcciones: Direccion[]

Direccion (nuevo)
  id, cliente_id (FK → Cliente),
  alias, destinatario_nombre, destinatario_apellidos,
  direccion_completa, ciudad, telefono, referencia?,
  es_principal (bool), creado_en, actualizado_en

ClienteResetToken (nuevo)
  id, cliente_id (FK → Cliente), token_hash, expira_en, usado (bool), creado_en
```

`Cliente.direccion` (texto libre) no se toca ni se migra: sigue usándose para POS/venta rápida. `Direccion` es la entidad nueva para clientes con cuenta.

Invitado (guest checkout, sin cambios en 2.1): sus datos de contacto/envío **no** crean ni matchean un `Cliente` — cuando 2.2 implemente pedidos, quedarán solo como snapshot del pedido.

## Endpoints

`ClientesAuthController`:
- `POST /clientes/auth/registro` — email/password/nombre/apellidos/teléfono; email duplicado → 400/409.
- `POST /clientes/auth/login` — credenciales inválidas → 401 genérico (no distingue email inexistente de `Cliente` sin `password_hash`).
- `POST /clientes/auth/refresh` — sin body; lee el refresh token de su propia cookie httpOnly.
- `POST /clientes/auth/solicitar-recuperacion` — siempre 200 genérico; genera `ClienteResetToken` solo si el cliente existe y tiene cuenta; dev-mode devuelve el token en la respuesta.
- `POST /clientes/auth/restablecer-password` — token inválido/usado/expirado → 400.
- `PATCH /clientes/auth/cambiar-password` — autenticado; password actual incorrecta → 401.
- `POST /clientes/auth/logout` — **necesario** por ser cookie httpOnly: el frontend no puede borrarla con JS. El endpoint responde seteando la cookie con `Max-Age=0` para que el navegador la elimine.

`ClientesController` (extendido) / nuevo sub-recurso:
- `GET /clientes/me`, `PATCH /clientes/me` — autenticado.
- `GET/POST /clientes/me/direcciones`
- `PUT/DELETE /clientes/me/direcciones/:id` — no pertenece al cliente autenticado → **404** (no 403, para no confirmar existencia).
- `PATCH /clientes/me/direcciones/:id/principal` — marca una como principal y desmarca las demás en la misma transacción.

## Frontend

- Páginas nuevas en `apps/frontend`: `/ingresar`, `/registro`, `/recuperar-password`.
- `mi-cuenta/page.tsx`: tabs Perfil y Direcciones conectadas a los endpoints reales; Resumen/Pedidos muestran estado vacío en vez de datos de ejemplo.
- Middleware de Next.js que lee la cookie httpOnly server-side y redirige a `/ingresar` en `/mi-cuenta/*` sin sesión.
- Nuevo cliente HTTP en `apps/frontend/src/lib` con `credentials: 'include'` (hoy no existe ninguno en `apps/frontend`; se sigue el mismo criterio que `apps/admin/src/lib/axios.ts`).

## Testing

- Unit: `ClienteAuthService` (email duplicado, credenciales inválidas incluyendo `Cliente` sin `password_hash` de POS, recuperación sin leak de existencia, token vencido/usado, cambio de password con actual incorrecta) + servicio de Direcciones (ownership cruzado, "marcar principal" desmarca las demás).
- E2e contra PostgreSQL real (mismo patrón corregido en 1.1: usuario/datos propios del test, cleanup scoped a IDs creados): registro → login → perfil → CRUD de direcciones, incluyendo que el cliente A no pueda tocar una dirección del cliente B (404).
- Frontend: prueba manual guiada contra el servidor real (login, registro, edición de perfil, alta/edición/borrado de dirección, recuperación de contraseña).
