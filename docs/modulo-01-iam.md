# Módulo 01 — IAM & Administración
## Sistema ENTREGAS.com.bo — ERP Interno

> **Estado:** Planificación
> **Tipo:** Vertical Slice (Backend + Frontend)
> **Prioridad:** P0 — Todos los demás módulos dependen de este

---

## 1. Alcance del Módulo

Este módulo es el cimiento de seguridad de todo el sistema. Cubre:

- Autenticación del personal interno (Login / Refresh / Logout / Cambio de Password)
- Gestión dinámica de Roles (CRUD desde UI)
- Gestión de Permisos (seeded desde código, asignación dinámica a roles)
- Gestión de Usuarios internos del ERP (crear, editar, activar/desactivar, asignar rol)
- Bitácora automática de auditoría (registrada desde la capa Application, no desde un interceptor HTTP)

**NO incluye:** registro de clientes (eso es Módulo CRM). Los usuarios de este módulo son exclusivamente el personal interno: Super Admin, Administrador, Encargado de Ventas, Vendedor.

---

## 2. Tablas de Base de Datos Involucradas

```
roles              → Define los roles del sistema
permisos           → Define las capacidades del sistema (seeded)
roles_permisos     → Relación dinámica rol ↔ permiso
usuarios           → Personal interno del ERP
bitacora           → Registro inmutable de acciones críticas
```

No se tocan otras tablas en este módulo.

---

## 3. Semillas Base (Seeds)

Al inicializar la base de datos por primera vez, el sistema debe autoconfigurarse (Bootstrapping) insertando registros esenciales.

### 3.1 Permisos del Sistema
Los permisos se definen en código y se cargan via seed. El usuario NO puede crear ni eliminar permisos.

| Código | Descripción |
|--------|-------------|
| `iam:usuarios:ver` | Ver lista y detalle de usuarios |
| `iam:usuarios:crear` | Crear nuevos usuarios internos |
| `iam:usuarios:editar` | Editar datos de usuarios |
| `iam:usuarios:cambiar_estado` | Activar / desactivar usuarios |
| `iam:usuarios:cambiar_rol` | Reasignar rol a un usuario |
| `iam:roles:ver` | Ver roles y sus permisos asignados |
| `iam:roles:crear` | Crear nuevos roles |
| `iam:roles:editar` | Editar nombre/descripción de roles |
| `iam:roles:eliminar` | Eliminar roles sin usuarios |
| `iam:roles:asignar_permisos` | Asignar/quitar permisos a un rol |
| `iam:bitacora:ver` | Ver el registro de auditoría |

### 3.2 Roles Base
Los siguientes roles se crean en el seed y se marcan con `es_protegido = true`.

| Rol | Descripción |
|-----|-------------|
| `Super Usuario` | Acceso total. No puede ser eliminado ni desactivado. |
| `Administrador` | Acceso a gestión interna salvo configuración crítica. |
| `Encargado de Ventas` | Gestión de ventas, descuentos y clientes. |
| `Vendedor` | Solo puede operar el POS. Sin acceso administrativo. |

### 3.3 El Primer Usuario ("Huevo y Gallina")
Dado que la creación de usuarios requiere permisos, el sistema inyecta un **Super Usuario inicial** en el seed:
- **Email:** admin@entregas.com.bo (configurable via `.env`)
- **Password:** Temporal generado o via `.env` (debe forzarse su cambio en el primer login).
- **Rol:** Asignado automáticamente al rol `Super Usuario`.

---

## 4. API Endpoints — Backend (NestJS)

### AUTH (`/auth`)
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| POST | `/auth/login` | Público | Login con email + password. Devuelve tokens en cookies `httpOnly`. |
| POST | `/auth/refresh` | Cookie `refresh_token` | Renueva el `access_token` silenciosamente. Rota el refresh token. |
| POST | `/auth/logout` | Cookie `access_token` | Invalida la sesión. Limpia ambas cookies. |
| GET | `/auth/me` | Cookie `access_token` | Devuelve datos del usuario autenticado con sus permisos. |
| PATCH | `/auth/password` | Cookie `access_token` | Permite al usuario logueado cambiar su propia contraseña. Requiere `password_actual` y `password_nuevo`. |

### USUARIOS (`/usuarios`)
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/usuarios` | `iam:usuarios:ver` | Lista paginada con filtros (nombre, rol, estado) |
| GET | `/usuarios/:public_id` | `iam:usuarios:ver` | Detalle de un usuario |
| POST | `/usuarios` | `iam:usuarios:crear` | Crea usuario interno. Email único. Password temporal generado por el sistema. |
| PATCH | `/usuarios/:public_id` | `iam:usuarios:editar` | Edita nombre, apellido, teléfono |
| PATCH | `/usuarios/:public_id/estado` | `iam:usuarios:cambiar_estado` | Activa o desactiva |
| PATCH | `/usuarios/:public_id/rol` | `iam:usuarios:cambiar_rol` | Cambia el rol asignado |

### ROLES (`/roles`)
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/roles` | `iam:roles:ver` | Lista todos los roles con sus permisos asignados |
| GET | `/roles/:id` | `iam:roles:ver` | Detalle de un rol |
| POST | `/roles` | `iam:roles:crear` | Crea un rol nuevo |
| PATCH | `/roles/:id` | `iam:roles:editar` | Edita nombre y descripción |
| DELETE | `/roles/:id` | `iam:roles:eliminar` | Elimina si no tiene usuarios. Protegido: roles base no se eliminan. |
| PUT | `/roles/:id/permisos` | `iam:roles:asignar_permisos` | Reemplaza todos los permisos del rol (operación atómica via `$transaction`). |

### BITÁCORA (`/bitacora`)
| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/bitacora` | `iam:bitacora:ver` | Lista paginada. Filtros: usuario, operación, entidad, rango de fechas |

---

## 5. Reglas de Negocio Críticas

### Autenticación y Tokens
- El `access_token` expira en **15 minutos**.
- El `refresh_token` expira en **7 días** y se rota en cada uso.
- **Validación Activa (Revocación):** El `jwt-auth.guard.ts` (o el strategy) **debe** verificar en caché/BD que el usuario sigue `activo = true` en cada request (o al menos en cada intento de refresh). Esto evita que un usuario desactivado por el admin siga operando durante la ventana de vida de su token.
- **Seguridad de Cookies:** Ambos tokens se envían y almacenan exclusivamente en cookies `httpOnly` + `SameSite=Strict`. *(Nota: En entornos locales de desarrollo con puertos diferentes, usar `SameSite=Lax` condicionalmente).*
- **Silent Refresh:** Si una request falla con `401`, el cliente frontend intenta `POST /auth/refresh` una sola vez. Si falla, redirige al login.
- Máximo **5 intentos fallidos** de login por IP en 5 minutos. Al 6° se bloquea por 15 minutos (Throttler).

### Usuarios
- Un usuario **nunca se elimina físicamente** de la BD, solo se inactiva (`activo = false`).
- El **Super Usuario** (`es_protegido = true`) no puede ser desactivado ni cambiar de rol. Validado en la capa de Application (Use Cases).
- Cuando el admin crea un usuario, este recibe una contraseña temporal. Debe usar `/auth/password` para cambiarla.
- El `public_id` (UUID) es el identificador expuesto en la API. El `id` interno (BIGINT) no sale de la BD.

### Roles y Permisos
- Un rol no puede eliminarse si tiene usuarios asignados (`409 Conflict`).
- Los 4 roles base son protegidos (`es_protegido = true`): no se pueden eliminar ni renombrar.
- La asignación de permisos a un rol (`PUT /roles/:id/permisos`) borra los actuales e inserta los nuevos en una sola transacción (`$transaction`).

### Bitácora
- La bitácora se escribe desde la **capa Application** (use cases), para poder leer el estado ANTES del cambio y capturar `datos_anteriores` confiablemente.
- Guarda: `usuario_id`, `ip`, `user_agent`, `entidad`, `entidad_id`, `operacion`, `datos_anteriores`, `datos_nuevos`, `creado_en`.
- Es **solo inserción**. Sin endpoints de modificación ni eliminación.

---

## 6. Estructura de Carpetas — Backend (`apps/api`)

La estructura respeta las tres capas de **Arquitectura Limpia**:
- `domain/` → entidades e interfaces. Sin Prisma ni NestJS.
- `application/` → casos de uso. Solo conoce `domain/`.
- `infrastructure/` → Prisma, NestJS, HTTP.

```
apps/api/src/
│
├── main.ts
├── app.module.ts
│
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts            ← Verifica cookie y valida que el user esté activo
│   │   └── permissions.guard.ts
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── prisma/
│       └── prisma.service.ts
│
└── modules/
    └── iam/
        ├── domain/                      ← Capa de Dominio (pura)
        │   ├── entities/
        │   │   ├── usuario.entity.ts
        │   │   ├── rol.entity.ts
        │   │   └── permiso.entity.ts
        │   └── repositories/            ← Interfaces
        │       ├── usuario.repository.interface.ts
        │       ├── rol.repository.interface.ts
        │       └── bitacora.repository.interface.ts
        │
        ├── application/                 ← Capa de Aplicación (Use Cases)
        │   └── use-cases/
        │       ├── auth/
        │       │   ├── login.use-case.ts
        │       │   ├── refresh-token.use-case.ts
        │       │   ├── logout.use-case.ts
        │       │   └── change-password.use-case.ts
        │       ├── usuarios/
        │       │   └── [CRUD use-cases]...
        │       └── roles/
        │           └── [CRUD use-cases]...
        │
        └── infrastructure/              ← Capa de Infraestructura
            ├── controllers/
            │   ├── auth.controller.ts
            │   └── [otros controllers]...
            ├── repositories/            ← Implementaciones Prisma
            │   └── [prisma-*.repository.ts]...
            ├── strategies/
            │   └── jwt.strategy.ts      ← Valida token y extrae claims
            └── dto/
```

> **Regla de dependencias:** `domain/` no importa nada externo. `application/` solo importa de `domain/`. `infrastructure/` importa de `application/` y `domain/`. Nunca al revés.

---

## 7. Criterios de Aceptación (Definition of Done)

El módulo se considera terminado cuando:

- [ ] `POST /auth/login` devuelve cookies `httpOnly` válidas y rechaza credenciales inválidas con `401`.
- [ ] El silent refresh funciona automáticamente en el frontend si expira el token.
- [ ] **Seguridad Revocación:** Si un admin desactiva un usuario, los request siguientes del usuario desactivado fallan con `401` inmediatamente (o en el siguiente refresh).
- [ ] El usuario logueado puede cambiar su propia contraseña exitosamente.
- [ ] El Super Usuario y roles base no pueden ser desactivados, eliminados ni renombrados (error controlado desde el Use Case).
- [ ] Eliminar un rol con usuarios asignados devuelve `409 Conflict`.
- [ ] Toda acción crítica registra entrada en `bitacora` con `datos_anteriores` y `datos_nuevos`.
- [ ] Los Use Cases de la capa Application pueden testearse unitariamente con repositorios mockeados (sin levantar BD ni NestJS).

---

*Documento actualizado para el proyecto ENTREGAS.com.bo — ERP Interno*
