# Arquitectura, Patrones y Buenas Prácticas (ERP Entregas)

Este documento es la **fuente de la verdad** para cualquier desarrollo, refactor o nueva feature dentro del proyecto. Todo código debe alinearse estrictamente a estas normativas para garantizar escalabilidad, mantenibilidad y seguridad.

## 1. Backend (apps/api) - Arquitectura Hexagonal

### 1.1. Capas y Responsabilidades
- **Controllers (Capa de Presentación):** Solo deben recibir la petición HTTP, validar el DTO y delegar la lógica a un Caso de Uso. **NUNCA** inyectar `PrismaService` directamente ni hacer consultas crudas acá.
- **Use Cases (Capa de Aplicación):** Contienen la lógica de negocio pura. Orquestan llamadas a repositorios o servicios externos. Deben ser inyectables (`@Injectable()`).
- **Repositories (Capa de Infraestructura):** Encargados exclusivos de la persistencia de datos (interacción con Prisma). Todo acceso a BD pasa por acá.

### 1.2. Seguridad y Autenticación (Crítico)
- Por defecto, toda la API está protegida por Guards de autenticación.
- Usar el decorador `@Public()` **ÚNICAMENTE** para rutas estrictamente públicas (ej. login, recuperación de contraseña, webhooks públicos).
- Cualquier endpoint que maneje datos de negocio, financieros o usuarios **DEBE** usar `@RequierePermiso('modulo:accion')` para aplicar control de acceso basado en roles (RBAC).

### 1.3. Base de Datos (Prisma) y Performance
- **Transacciones (`$transaction`):** Cualquier operación de escritura que afecte a múltiples tablas (ej. crear una Venta, sus Detalles y actualizar Inventario) **DEBE** ir envuelta en una transacción. Nunca dejar los datos en estado inconsistente si un paso falla.
- **Problema N+1:** Prohibido hacer queries dentro de bucles (`for`/`map`). Usar siempre la cláusula `include` de Prisma para traer relaciones en una sola consulta.
- **Validación DTO:** Toda carga útil (`Payload`) entrante debe estar fuertemente validada con `class-validator` en los DTOs. Nunca confiar en `req.body` ciegamente.

## 2. Frontend (apps/admin) - Atomic Design y Componentización

### 2.1. Patrón Container-Presentational
- Los archivos `page.tsx` actúan exclusivamente como **Orquestadores (Containers)**. Su trabajo es manejar el estado global de la página, hacer fetching de datos (si no se usa Server Components) y renderizar componentes.
- **NUNCA** crear archivos monolíticos de más de 300-400 líneas. Si una vista tiene tabs, paneles o secciones complejas, deben extraerse a la carpeta `components/` de esa feature.

### 2.2. React y Next.js App Router
- **Client vs Server Components:** Por defecto, los componentes en App Router son de servidor. Usar `'use client'` de manera responsable SOLO cuando se necesite interactividad (hooks como `useState`, `useEffect` o eventos de UI).
- **Fugas de Memoria (Memory Leaks):** Todo `useEffect` que instancie un listener (ej. `window.addEventListener`) o un `setInterval` **DEBE** retornar una función de limpieza (cleanup function). Las dependencias deben estar explícitas y completas.
- **Manejo de Estado URL:** Para filtros de tablas, paginación o búsquedas, preferir guardar el estado en la URL (Search Params) en lugar de un `useState` local. Esto permite compartir el link con los filtros aplicados.

### 2.3. Estilos (CSS)
- **Prohibido el uso masivo de Inline Styles (`style={{...}}`).**
- Todos los estilos deben ir en archivos de **CSS Modules** (`NombreComponente.module.css`).
- Utilizar variables globales del sistema (`var(--bg-color)`, `var(--text-main)`) para mantener consistencia visual y soportar temas.
- **Responsividad:** Diseñar "Mobile First". Evitar anchos fijos duros (`width: 300px`); preferir flexbox, grid, `min-width` o `max-width` y porcentajes para que la UI no se rompa al redimensionar.

## 3. Prácticas Generales
- **Paginación:** Todo listado de datos (reportes, usuarios, ventas, etc.) que pueda crecer a más de 50 registros **debe ser paginado** tanto en backend como en frontend para evitar cuellos de botella de memoria y red.
- **Tipado Fuerte:** Evitar el uso de `any` en TypeScript. Definir interfaces o tipos exactos para las respuestas de la API y los estados de los componentes. Nunca silenciar el compilador.
- **Manejo de Errores y UX:** Evitar crasheos silenciosos. El backend debe devolver un formato de respuesta estándar (`{ success: boolean, message: string, data?: any }`) y el frontend debe manejar los estados de "Cargando", "Vacío" y "Error" brindando feedback visual claro al usuario.

---
*Nota para el Agente AI: Lee este documento y asegúrate de cumplir TODAS las reglas listadas aquí antes de proponer código, ejecutar cambios estructurales o responder al usuario.*
