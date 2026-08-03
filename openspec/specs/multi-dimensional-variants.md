
# Especificación: Variantes Multi-Dimensionales (Modelo Shopify)

## 1. Objetivo
Permitir que los productos tengan múltiples dimensiones de variación (ej. Color y Empaque) para que en la tienda el cliente pueda seleccionar las opciones mediante selectores independientes (ej. seleccionar "Color: Azul" y "Empaque: Caja x12"), en lugar de un listado plano de botones.

## 2. Enfoque Arquitectónico (JSONB)
Para evitar crear 3 nuevas tablas relacionales que complejicen el CRUD y las consultas, utilizaremos la potencia de `JSONB` en PostgreSQL. Esto imita la forma en que arquitecturas modernas manejan atributos dinámicos sin penalizar el rendimiento.

### 2.1 Cambios en Base de Datos
Se añadirán dos nuevas columnas en formato JSON:

1. **Tabla `productos`**:
   `ALTER TABLE productos ADD COLUMN opciones_variantes JSONB NOT NULL DEFAULT '[]'::JSONB;`
   - *Propósito:* Define la "matriz" disponible.
   - *Ejemplo:* `[{"nombre": "Color", "valores": ["Rojo", "Azul"]}, {"nombre": "Empaque", "valores": ["Unidad", "Caja"]}]`

2. **Tabla `presentaciones` (Variantes)**:
   `ALTER TABLE presentaciones ADD COLUMN combinacion_opciones JSONB NOT NULL DEFAULT '{}'::JSONB;`
   - *Propósito:* Define a qué cruce de opciones pertenece este SKU exacto.
   - *Ejemplo:* `{"Color": "Rojo", "Empaque": "Caja"}`

## 3. Impacto en el Backend (NestJS API)
- **DTOs:** Actualizar `CreateProductoDto` y `CreatePresentacionDto` para aceptar estas nuevas propiedades JSON.
- **Entidades:** Agregar `@Column({ type: 'jsonb', default: [] })` en TypeORM.
- *Nota de seguridad:* No requiere refactorización de queries de inventario ya que la tabla base `presentaciones` no cambia su relación principal (id) con el kardex de inventario.

## 4. Impacto en el Catálogo (Admin Frontend)
- **Formulario de Producto:** Añadir un constructor visual de "Opciones" en la ventana modal de variantes. El administrador podrá agregar una opción (ej. "Color") y asignar los valores posibles.
- **Generación de Variantes:** Al guardar las opciones, el sistema autogenerará la tabla con las combinaciones (Rojo-Unidad, Rojo-Caja) para que el administrador sólo asigne Precio y SKUs.

## 5. Impacto en la Tienda (Storefront)
- **Product Page (`page.tsx`):**
  1. Si un producto tiene `opciones_variantes`, renderizar grupos de botones independientes.
  2. Mantener un estado local (`selectedOptions`) que guarde la selección actual del usuario (ej. `{ Color: 'Rojo', Empaque: 'Unidad' }`).
  3. Cada vez que el usuario hace clic, buscar en `realProduct.presentaciones` la presentación exacta que coincida con esa combinación de JSON.
  4. Mostrar el precio correspondiente y configurar el botón de "Añadir al carrito" con el ID real de esa presentación.
  5. Manejar botones deshabilitados para combinaciones que no existan.

## 6. Fases de Ejecución (Paso a Paso)
- [ ] **Paso 1:** Alterar DB y Entidades/Controladores del Backend API.
- [ ] **Paso 2:** Actualizar Storefront (Tienda) para leer la nueva estructura de JSON y mostrar UI multi-dimensional.
- [ ] **Paso 3:** Modificar Admin Panel para crear y editar esta estructura de datos al dar de alta productos.
