
# Spec: IAM Backend
## Módulo 01 - ENTREGAS.com.bo

**Referencia principal:** [modulo-01-iam.md](../../docs/modulo-01-iam.md)

## 1. Objetivo
Implementar la estructura completa del Backend (NestJS + Prisma) para el módulo IAM, aplicando de forma estricta la **Arquitectura Limpia** (Domain → Application → Infrastructure).

## 2. Requerimientos Estrictos
- El código debe ir en `apps/api/src/modules/iam/`.
- No mezclar infraestructura en la capa de aplicación. NestJS (`@Injectable`, `Controller`, etc.) y Prisma solo viven en `infrastructure/`.
- Los Use Cases (capa `application/`) solo deben depender de interfaces definidas en `domain/repositories/`.
- La bitácora (auditoría) debe registrarse obligatoriamente llamando al repositorio de bitácora **desde los Use Cases**, no mediante interceptores de NestJS.
- La seguridad es stateless con JWT almacenado **solo en cookies httpOnly**.

## 3. Plan de Trabajo

### Tarea 1: Base de Datos y Semillas
1. Modificar `apps/api/prisma/schema.prisma` para incluir: `Usuario`, `Rol`, `Permiso`, `RolPermiso` (relación N:M) y `Bitacora`.
2. Crear `apps/api/prisma/seed.ts` para popular los permisos, roles base y el Super Usuario inicial.

### Tarea 2: Dominio (Domain)
1. Crear `entities/` (Usuario, Rol, Permiso).
2. Crear `repositories/` (interfaces para Usuario, Rol, Bitácora).

### Tarea 3: Casos de Uso (Application)
1. Implementar `use-cases/auth/` (login, refresh, logout, change-password).
2. Implementar `use-cases/usuarios/` (crud, change-rol, change-estado).
3. Implementar `use-cases/roles/` (crud, assign-permisos).
4. **Testing:** Crear unit tests con Jest para al menos los casos de uso críticos (login, cambio de rol), mockeando los repositorios.

### Tarea 4: Infraestructura y Endpoints
1. Implementar los repositorios Prisma (`prisma-usuario.repository.ts`, etc).
2. Crear los DTOs y Controladores.
3. Configurar el `jwt.strategy.ts`, `jwt-auth.guard.ts` (verificando estado activo del usuario), y `permissions.guard.ts`.
4. Armar el `IamModule` e inyectarlo en `app.module.ts`.
