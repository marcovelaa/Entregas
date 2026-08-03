# Inventario y Kardex Specification

## Purpose
Consulta de stock y registro estricto e inmutable de movimientos de inventario (Kardex) para asegurar la trazabilidad completa del almacén.

## Requirements

### Requirement: Consulta y Control de Stock
El sistema MUST mantener el estado actual del inventario por producto. El `stock_actual` no MUST ser menor a cero. El `stock_reservado` no MUST ser mayor al `stock_actual`.

#### Scenario: Consulta de stock
- GIVEN un producto con registro de inventario
- WHEN el usuario consulta el stock
- THEN el sistema devuelve las cantidades actuales, reservadas, mínimas y máximas

#### Scenario: Prevención de stock negativo
- GIVEN un inventario con stock_actual de 5
- WHEN el sistema intenta reducir el stock en 10
- THEN la operación es rechazada en la base de datos por restricción (stock >= 0)

### Requirement: Registro Inmutable de Movimientos (Kardex)
El sistema MUST registrar cada variación de stock mediante un asiento en la tabla `movimientos_inventario`. Este registro MUST ser inmutable e incluir el stock anterior y el resultante, así como la cantidad de la transacción.

#### Scenario: Movimiento documentado
- GIVEN una operación de compra u orden
- WHEN se registra un movimiento de ENTRADA
- THEN se almacena el ID del documento, el tipo de documento, y se asocia al usuario que realiza la acción

#### Scenario: Validación de tipo de documento
- GIVEN un intento de registro de movimiento
- WHEN se provee el `tipo_documento` pero no el `documento_id` (o viceversa)
- THEN el sistema rechaza la operación por violación de restricción (deben proveerse ambos o ninguno)

### Requirement: Transaccionalidad Atómica (Stock + Kardex)
El sistema MUST asegurar que la actualización de la tabla `inventario` y la inserción en `movimientos_inventario` se realicen siempre dentro de una misma transacción atómica con bloqueos adecuados (e.g., `SELECT FOR UPDATE`) para evitar condiciones de carrera.

#### Scenario: Actualización atómica exitosa
- GIVEN una solicitud de ingreso de stock
- WHEN el sistema procesa la entrada
- THEN incrementa el `stock_actual` en inventario
- AND inserta el movimiento correspondiente en la misma transacción

#### Scenario: Rollback por error
- GIVEN una transacción de actualización de inventario
- WHEN falla la inserción del registro en Kardex
- THEN toda la operación realiza rollback y el `stock_actual` se mantiene inalterado
