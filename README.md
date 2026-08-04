# Sistema Integral ERP, POS & E-commerce (Monorepo)

Monorepo empresarial de alto rendimiento construido con arquitectura hexagonal en backend y diseño atómico en frontend, orientado a la gestión integral de catálogo, inventario unificado, combos con receta (BOM), motor de promociones y venta multicanal (Punto de Venta POS y Tienda Online).

---

## 🏗️ Estructura del Proyecto

El proyecto está organizado como un **Turborepo** con TypeScript estricto:

```
├── apps/
│   ├── api/          # Backend NestJS (Arquitectura Hexagonal / Clean Architecture)
│   ├── admin/        # Panel de Administración & POS (Next.js App Router + CSS Modules)
│   └── frontend/     # Tienda E-commerce pública (Next.js App Router + Turbopack)
├── packages/
│   ├── combo-rules/  # Lógica de dominio y validaciones compartidas
│   ├── eslint-config/# Configuraciones ESLint compartidas
│   └── typescript-config/ # Configuraciones tsconfig compartidas
├── docker-compose.yml# Orquestación de PostgreSQL 15
└── docs/             # Documentación técnica y guías de arquitectura
```

---

## 🚀 Guía de Inicio Rápido en macOS (iMac)

### 1. Requisitos Previos
- **Node.js**: v20.x o superior ([Descargar](https://nodejs.org/))
- **Docker Desktop para Mac**: Para la base de datos PostgreSQL ([Descargar](https://www.docker.com/products/docker-desktop/))
- **Git**

---

### 2. Clonar y Configurar Variables de Entorno

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd <CARPETA_DEL_PROYECTO>

# 2. Configurar variables de entorno desde los ejemplos
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env.local
cp apps/frontend/.env.example apps/frontend/.env.local
```

---

### 3. Levantar la Base de Datos

```bash
docker compose up -d
```
*Esto levantará PostgreSQL 15 en el puerto local `5433` con la base de datos `entregas_db`.*

---

### 4. Instalar Dependencias y Ejecutar Migraciones

```bash
# Instalar todas las dependencias del monorepo
npm install

# Aplicar migraciones y seed inicial en la API
cd apps/api
npx prisma migrate deploy
npm run db:seed
cd ../..
```

---

### 5. Iniciar los Servidores en Desarrollo

Desde la raíz del monorepo:

```bash
npm run dev
```

Esto levantará concurrentemente:
- 🌐 **Backend API**: `http://localhost:3001` (Swagger docs en `http://localhost:3001/api/docs`)
- 🖥️ **Admin & POS**: `http://localhost:3000`
- 🛒 **E-commerce**: `http://localhost:3002`

#### Credenciales por defecto del Super Usuario:
- **Email:** `admin@entregas.com.bo`
- **Contraseña:** `temporal123`

---

## 🏛️ Decisiones de Arquitectura y Diseño

### 1. Backend: Hexagonal / Clean Architecture (NestJS + Prisma)
Cada módulo en `apps/api/src/modules/` sigue estrictamente la separación de responsabilidades:
- **Domain (`/domain`)**: Entidades puras, interfaces de repositorios y reglas de negocio agnósticas a la base de datos.
- **Application (`/application`)**: Casos de uso (`Use Cases`) y DTOs de entrada/salida.
- **Infrastructure (`/infrastructure`)**: Controladores HTTP, adaptadores Prisma y mapeadores de persistencia.

### 2. Catálogo & Patrón de Variante Base Automática
- Todo producto simple cuenta de manera transparente con una **Variante Base ("Estándar")**.
- **Beneficio clave:** Se eliminó el inventario dividido (`variante_id: null`). Todo el stock, compras, ventas y empaques se vinculan directamente a variantes sin duplicidad ni ambigüedad.
- Cualquier producto simple puede definir **Empaques / Presentaciones** (Caja x 12, Docena, Paquete) sin restricciones de clave foránea.

### 3. Motor de Combos & Recetas BOM (Bill of Materials)
- Los combos no tienen stock físico propio; su **Stock Virtual** se deriva en tiempo real analizando la receta de componentes y el cuello de botella del inventario disponible.
- Al vender un combo, el sistema descuenta atómicamente el stock exacto de cada producto/variante componente en una sola transacción segura con `$transaction`.
- Soporte para reglas de disponibilidad independientes: Vigencia por fechas/horas, Días de la semana específicos y Cupo máximo de ventas.

### 4. Motor de Descuentos & Precios
- Motor con cálculo dinámico en cascada priorizado: `Combos > Precio Promocional > Reglas Automáticas de Descuento > Precio de Lista`.

---

## 🔍 Guía para Auditoría del Código (Por dónde empezar)

Si estás auditando la solución en la iMac, te recomendamos revisar los siguientes puntos neurálgicos:

| Módulo / Funcionalidad | Ubicación Clave en el Código | Qué Auditar |
| :--- | :--- | :--- |
| **Combos & Stock BOM** | [`apps/api/src/modules/catalogo/domain/combo-stock.ts`](file:///apps/api/src/modules/catalogo/domain/combo-stock.ts) | Algoritmo de cálculo de stock virtual y detección de cuellos de botella |
| **Descuentos & Reglas** | [`apps/api/src/modules/descuentos/domain/discount-engine.service.ts`](file:///apps/api/src/modules/descuentos/domain/discount-engine.service.ts) | Motor de priorización y aplicación de reglas de descuento |
| **Transacciones de Venta** | [`apps/api/src/modules/ventas/infrastructure/repositories/prisma-venta.repository.ts`](file:///apps/api/src/modules/ventas/infrastructure/repositories/prisma-venta.repository.ts) | Descuento atómico de stock para simples, variantes, empaques y combos |
| **Repositorio de Catálogo** | [`apps/api/src/modules/catalogo/infrastructure/repositories/prisma-producto.repository.ts`](file:///apps/api/src/modules/catalogo/infrastructure/repositories/prisma-producto.repository.ts) | Creación automática de variante base y sincronización de precios |
| **Formulario de Combos (UI)** | [`apps/admin/src/app/descuentos/combos/components/ComboEditorForm.tsx`](file:///apps/admin/src/app/descuentos/combos/components/ComboEditorForm.tsx) | UX de disponibilidad, validaciones reactivas y recetas |
| **Pruebas Unitarias** | `cd apps/api && npm run test` | Suite de 79 tests unitarios automatizados que verifican casos borde |

---

## 🧪 Ejecutar Tests

```bash
cd apps/api
npm run test
```
