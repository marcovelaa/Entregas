# Guardrails de arquitectura del monorepo Entregas

Este documento define las reglas durables que deben revisarse antes de desarrollar, corregir o refactorizar. Su objetivo es prevenir errores, en especial los repetidos. No reemplaza la lectura del módulo afectado ni la verificación del código real.

## Ruta obligatoria antes de cualquier cambio

1. **Leer este documento** y localizar el código, contrato y pruebas existentes del módulo afectado.
2. **Clasificar el impacto:** workspace, capa, límites entre módulos, autenticación/autorización, datos, concurrencia, interfaz, operaciones y compatibilidad.
3. **Implementar dentro de los límites existentes.** No introducir patrones, dependencias o contratos nuevos sin justificar la decisión.
4. **Verificar el resultado** con la Definition of Done de este documento y con los scripts exactos disponibles en los `package.json` afectados.

Si una regla no puede cumplirse, el cambio requiere un ADR antes de continuar. Una urgencia no autoriza a omitir seguridad, integridad de datos ni verificación.

## 1. Alcance y responsabilidades

| Workspace | Responsabilidad | Límites principales |
|---|---|---|
| `apps/api` | API, casos de uso, persistencia e integraciones | No delegar reglas de seguridad o integridad al frontend. |
| `apps/admin` | ERP/backoffice | Consumir la API; no acceder a la base de datos ni replicar autorización. |
| `apps/frontend` | E-commerce orientado al cliente | Consumir la API; validar ownership en el backend, nunca solo en la UI. |
| `packages/combo-rules` | Reglas compartidas de negocio para combos | Mantener lógica determinista y sin dependencias de React, Next.js, NestJS o Prisma. |
| `packages/ui` | Componentes visuales reutilizables | No contener reglas de negocio, acceso a API ni conocimiento de una aplicación concreta. |
| `packages/eslint-config`, `packages/typescript-config` | Configuración compartida de ESLint y TypeScript | No incorporar código de runtime ni excepciones específicas ocultas. |

### 1.1. Límites de módulos y dependencias

- Las aplicaciones no se importan entre sí. El código compartido se extrae a un paquete con responsabilidad clara.
- Los paquetes compartidos no dependen de `apps/*` ni conocen rutas, variables de entorno o infraestructura de una aplicación.
- Cada módulo expone una interfaz pública mínima. No importar archivos internos de otro módulo para evitar su contrato público.
- La lógica de negocio vive en casos de uso, servicios de dominio o paquetes de reglas; no en controllers, componentes visuales ni utilidades genéricas.
- Evitar dependencias circulares. Si aparecen, revisar la dirección de dependencias en lugar de ocultarlas con imports indirectos.
- Una dependencia nueva debe resolver una necesidad comprobada, ser compatible con el runtime y no duplicar una capacidad existente.

## 2. Backend: `apps/api`

### 2.1. Capas y responsabilidades

- **Controllers:** reciben HTTP, aplican DTOs y delegan. No contienen lógica de negocio ni acceden directamente a Prisma.
- **Aplicación/casos de uso:** coordinan reglas de negocio, repositorios e integraciones mediante dependencias explícitas.
- **Dominio:** expresa invariantes sin depender de HTTP, NestJS o Prisma cuando la regla puede mantenerse pura.
- **Infraestructura/repositorios:** encapsulan persistencia, consultas Prisma y adaptadores externos.
- Los cruces entre módulos se realizan mediante servicios o contratos exportados, no mediante acceso a tablas o implementaciones internas ajenas.

### 2.2. Matriz obligatoria de autenticación y autorización

Toda ruta debe pertenecer explícitamente a una de estas categorías:

| Categoría | Autenticación | Autorización obligatoria |
|---|---|---|
| Pública | Ninguna, declarada de forma explícita con `@Public()` | Solo información o acciones realmente públicas; aplicar validación y rate limit cuando corresponda. |
| Backoffice | Identidad autenticada | RBAC con `@RequierePermiso('modulo:accion')` o el mecanismo equivalente vigente. |
| Cliente autenticado | Identidad autenticada | Verificación de ownership o alcance sobre cada recurso; conocer un ID no concede acceso. |
| Webhook | Firma o credencial del proveedor | Verificar firma, vigencia, replay e idempotencia antes de producir efectos. |

Reglas críticas:

- Está prohibido omitir o simular autenticación mediante usuarios hardcodeados, permisos `*`, guards que siempre aprueban o condiciones de entorno en código de producción.
- Las sustituciones de autenticación solo pueden existir dentro de pruebas aisladas y nunca quedar alcanzables desde el runtime de la aplicación.
- `@Public()` debe ser una excepción mínima y revisable. Un webhook no es público por el solo hecho de no usar una sesión de usuario.
- El RBAC protege operaciones del personal; el acceso de clientes exige ownership. Un mecanismo no reemplaza al otro.
- Nunca confiar en roles, permisos, precios, totales ni identificadores de propietario enviados por el cliente.

### 2.3. Contratos HTTP y validación

- Validar toda entrada mediante DTOs y reglas explícitas. Rechazar propiedades inesperadas cuando el contrato vigente así lo establezca.
- Usar tipos concretos de extremo a extremo. No introducir `any`, casts para silenciar el compilador ni respuestas sin contrato.
- Mantener el contrato de respuesta vigente del endpoint. No inventar un envelope global ni documentarlo como existente sin implementarlo, tiparlo y versionarlo de forma coordinada.
- Los errores deben usar códigos HTTP correctos, mensajes seguros y una forma estable documentada. No filtrar stack traces, SQL, secretos ni detalles internos.

- Los listados potencialmente grandes deben paginarse con límites máximos, orden determinista y metadatos consistentes con el contrato vigente.
- Un cambio incompatible requiere versionado o una migración coordinada de consumidores. No cambiar silenciosamente nombres, tipos, nulabilidad o semántica.
- Las operaciones reintentables o expuestas a duplicación deben definir una clave o estrategia de idempotencia.

### 2.4. Prisma, integridad y rendimiento

- El acceso a Prisma pertenece a infraestructura/repositorios, no a controllers ni componentes frontend.
- Cada cambio de esquema debe incluir una migración revisable, compatibilidad con datos existentes y una estrategia de reversión; si no es reversible, debe declararse antes de aplicar.
- Las invariantes importantes se protegen también con constraints, claves únicas y relaciones en la base de datos, no solo con validación de aplicación.
- Añadir índices de acuerdo con consultas reales, filtros, joins y ordenamientos. Verificar el costo de escritura y evitar índices redundantes.
- Las escrituras de varias tablas o pasos que deben ser atómicos usan `$transaction` y preservan invariantes ante fallos parciales.
- Diseñar explícitamente la concurrencia: evitar secuencias vulnerables de leer-modificar-escribir; usar constraints, actualizaciones condicionales, niveles de aislamiento o locks cuando corresponda.
- Prevenir N+1 evitando viajes a la base de datos por cada fila. Elegir `select`, `include`, consultas agregadas, batching o precarga según el caso; `include` no es una regla universal.
- Los importes monetarios usan `Decimal` o la representación definida por el dominio, con escala y redondeo explícitos. No usar coma flotante para cálculos financieros.
- `Decimal` y `BigInt` deben tener una serialización externa explícita y estable. No convertir `BigInt` a `Number` sin demostrar que el rango es seguro.
- Seeds, migraciones de datos y jobs deben ser idempotentes o documentar claramente por qué no pueden repetirse.

### 2.5. Pruebas backend

- Toda corrección de defecto debe incluir una prueba de regresión que falle sin la corrección.
- Probar reglas de negocio en unidades pequeñas y deterministas.
- Probar repositorios, migraciones e integraciones contra límites reales cuando su comportamiento no pueda demostrarse con mocks.
- Los endpoints críticos requieren pruebas e2e de autenticación, permisos u ownership, validación, respuesta y efectos persistidos.
- Incluir casos de fallo, concurrencia, reintento e idempotencia cuando el riesgo del flujo lo requiera.
- Las pruebas no dependen de servicios externos reales, datos personales ni orden de ejecución.

## 3. Frontend: `apps/admin` y `apps/frontend`

### 3.1. Componentes, datos y estado

- En App Router, `page.tsx` es una frontera de ruta y puede ser un Server Component. Debe orquestar la página sin acumular UI y lógica de negocio innecesarias.
- Usar `'use client'` solo en el límite que necesita estado, efectos, eventos o APIs del navegador. No convertir árboles completos en Client Components por comodidad.
- Centralizar el acceso a la API en clientes o servicios tipados. No dispersar URLs, headers, manejo de sesión o formas de respuesta entre componentes.
- El servidor sigue siendo la autoridad para permisos, ownership, precios, stock y totales. Ocultar un control en la UI no constituye autorización.
- Preferir estado derivado o del servidor. Usar URL/search params para filtros, búsqueda, orden y paginación compartibles; mantener estado local para interacción efímera.
- Todo efecto con listeners, timers, suscripciones o solicitudes cancelables debe liberar recursos y evitar actualizaciones después del desmontaje.
- Cada flujo asíncrono contempla estados de carga, vacío, error y éxito, con mensajes accionables.
- No duplicar reglas de negocio compartidas; extraerlas a un paquete apropiado, como `packages/combo-rules`, cuando deban coincidir entre runtimes.

### 3.2. CSS, responsividad y accesibilidad

- Usar CSS Modules y variables del sistema visual. Los estilos inline quedan reservados para valores realmente dinámicos, no para sustituir hojas de estilo.
- Diseñar mobile-first sin anchos rígidos que rompan el layout. Verificar contenido, navegación, tablas, formularios, modales y acciones en pantallas pequeñas.
- Un tamaño de 300–400 líneas es una señal para revisar responsabilidades, no una regla arquitectónica automática. Extraer componentes cuando mejore cohesión, prueba o reutilización.
- Usar HTML semántico, navegación por teclado, foco visible, labels asociados, texto alternativo y contraste suficiente.
- No comunicar estado únicamente mediante color. Los errores y validaciones deben ser comprensibles para tecnologías de asistencia.

### 3.3. Rendimiento

- Evitar poll
ing, timers, listeners y refetches sin límites. Definir frecuencia, pausa al ocultar la pestaña y cleanup cuando correspondan.
- No enviar al cliente datos, JavaScript o dependencias que no necesita. Preferir Server Components y carga diferida cuando reduzcan costo real.
- Optimizar imágenes, listas extensas y renders solo después de identificar el cuello de botella; no introducir memoización indiscriminada.
- Evitar duplicar solicitudes y controlar cancelación, caché y revalidación según la naturaleza de los datos.

## 4. Operación y seguridad transversal

- Los secretos se obtienen desde variables de entorno validadas al inicio. Nunca se incluyen en código, logs, fixtures, imágenes o artefactos versionados.
- Mantener separados los valores de desarrollo, pruebas y producción. Los defaults inseguros no deben permitir arrancar producción.
- Los logs deben ser estructurados, útiles para correlación y libres de credenciales, tokens, datos sensibles o payloads completos innecesarios.
- Los health checks distinguen, cuando corresponda, proceso vivo y servicio listo; deben ser económicos y no exponer información interna.
- Los jobs programados declaran frecuencia, exclusión/concurrencia, idempotencia, timeout, reintentos, manejo de fallos y observabilidad.
- Los uploads validan tamaño, tipo real del archivo y destino autorizado; no confiar únicamente en nombre, extensión o `Content-Type` del cliente.
- Toda integración externa define timeouts, errores esperados, reintentos acotados y comportamiento ante indisponibilidad.
- Los procesos de desarrollo deben iniciarse solo para los workspaces necesarios y con watchers limitados para evitar consumo innecesario de CPU y memoria.

## 5. Excepciones y decisiones arquitectónicas

- Una excepción a estas reglas requiere un ADR breve: contexto, decisión, alternativas, tradeoffs, alcance y condición de revisión o retiro.
- Un ADR no convierte una solución temporal en permanente; debe indicar responsable y deuda resultante cuando corresponda.
- Los cambios que alteren estos guardrails actualizan este documento en el mismo trabajo.
- El estado temporal de defectos, incidentes o ramas no pertenece aquí; debe registrarse en issues, reportes o documentación operativa.

## 6. Definition of Done obligatoria

Antes de cerrar cualquier cambio:

- [ ] Se identificaron los workspaces, capas, consumidores y contratos afectados.
- [ ] Se respetaron los límites de dependencias y no se duplicó lógica de negocio.
- [ ] Cada endpoint afectado quedó clasificado como público, backoffice, cliente autenticado o webhook, con su control correcto.
- [ ] Se verificaron permisos de personal, ownership de clientes y ausencia de bypasses de autenticación.
- [ ] Entradas, salidas, errores, paginación y compatibilidad están tipados y probados sin `any`.
- [ ] Los cambios Prisma incluyen migración, constraints e índices necesarios, transacción, concurrencia, idempotencia y serialización cuando aplican.
- [ ] Toda corrección tiene prueba de regresión y los flujos críticos cubren casos negativos.
- [ ] La UI contempla carga, vacío, error, éxito, mobile-first, teclado y accesibilidad.
- [ ] Se revisaron secretos, logs, jobs, uploads, integraciones y consumo de recursos cuando aplican.
- [ ] Se leyó el `package.json` raíz y el de cada workspace afectado; se ejecutaron los scripts exactos que allí existen y aplican para lint, tipos, pruebas y build. No se inventaron alias ni se declaró una verificación inexistente.
- [ ] Si un manifiesto no ofrece una verificación necesaria, la ausencia quedó registrada como deuda y se aplicó la comprobación disponible más cercana sin ocultar la limitación.
- [ ] Los comandos ejecutados y sus resultados quedaron reportados; cualquier omisión tiene una razón explícita.
- [ ] Las excepciones arquitectónicas quedaron registradas mediante ADR.

---

**Instrucción para personas y agentes:** leer y aplicar esta ruta antes de proponer o ejecutar cambios. Verificar siempre contra el código y los manifiestos actuales; este documento define guardrails, no sustituye la evidencia.
