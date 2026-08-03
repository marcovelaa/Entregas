# Catálogo Gestión Specification

## Purpose
Gestión centralizada de productos, sus variantes (presentaciones y empaques), su categorización (marcas, categorías) y metadatos, incluyendo el manejo de imágenes y atributos para el sistema ERP "Entregas".

## Requirements

### Requirement: CRUD de Marcas
El sistema MUST permitir la creación, lectura, actualización y desactivación (soft-delete) de Marcas. El sistema MUST garantizar la unicidad de `nombre` y `slug`.

#### Scenario: Crear Marca exitosamente
- GIVEN un nombre y un slug válidos y únicos
- WHEN el usuario crea una nueva marca
- THEN la marca se guarda en la base de datos
- AND se devuelve el identificador de la nueva marca

#### Scenario: Fallo por slug duplicado
- GIVEN una marca existente con slug "nike"
- WHEN el usuario intenta crear una nueva marca con slug "nike"
- THEN el sistema rechaza la operación
- AND devuelve un error de validación por unicidad

### Requirement: CRUD de Categorías con Jerarquía
El sistema MUST permitir la gestión de Categorías, soportando una jerarquía (mediante `categoria_padre_id`). El sistema MUST evitar referencias circulares (una categoría no puede ser su propia padre) y garantizar la unicidad del `slug`.

#### Scenario: Crear subcategoría
- GIVEN una categoría padre existente
- WHEN el usuario crea una categoría especificando el `categoria_padre_id`
- THEN la categoría se asocia correctamente a la categoría padre

#### Scenario: Restricción de autorreferencia
- GIVEN una categoría existente
- WHEN el usuario intenta actualizar la categoría estableciendo como `categoria_padre_id` su propio ID
- THEN el sistema rechaza la operación por violación de restricción

### Requirement: Gestión de Productos
El sistema MUST gestionar productos con sus metadatos (`atributos` JSONB) y relaciones (Marca, Categoría). El `sku` MUST ser único. El `precio_promocional`, si se provee, MUST ser menor al `precio_base`.

#### Scenario: Crear producto con atributos JSONB y promoción
- GIVEN datos válidos de producto, atributos adicionales en JSONB y un precio promocional menor al base
- WHEN el usuario crea el producto
- THEN el sistema almacena el producto correctamente

#### Scenario: Fallo por precio promocional inválido
- GIVEN datos de producto con `precio_promocional` mayor o igual al `precio_base`
- WHEN el usuario intenta crearlo o actualizarlo
- THEN el sistema rechaza la operación

### Requirement: Galería de Imágenes por Producto
El sistema MUST permitir la asociación de múltiples imágenes a un producto. La `url` MUST ser única para un mismo producto. Se MUST soportar el ordenamiento de las mismas.

#### Scenario: Agregar imágenes a un producto
- GIVEN un producto existente
- WHEN el usuario sube y asocia una o más imágenes con URLs distintas
- THEN el sistema las guarda asociadas al producto con su respectivo orden

### Requirement: Gestión de Presentaciones
El sistema MUST gestionar las diferentes presentaciones de un producto (e.g., cajas, docenas). Cada presentación MUST tener un multiplicador de unidades mayor a cero. El `sku` y `codigo_barras` MUST ser únicos a nivel global, y el `nombre` MUST ser único dentro del mismo producto.

#### Scenario: Crear presentación válida
- GIVEN un producto existente
- WHEN el usuario crea una presentación con nombre único para el producto y SKU globalmente único
- THEN el sistema almacena la presentación

#### Scenario: Fallo por multiplicador inválido
- GIVEN un producto
- WHEN el usuario intenta crear una presentación con multiplicador de unidades en 0
- THEN el sistema rechaza la operación
