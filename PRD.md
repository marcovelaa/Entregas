Product Requirements Document (PRD) - ENTREGAS.com.bo
1. Visión General del Producto
ENTREGAS.com.bo es un sistema híbrido (E-commerce B2C/B2B y Punto de Venta físico) especializado en material educativo. El sistema gestiona todo el ciclo de vida del comercio: compras a proveedores, control riguroso de inventario (Kardex), catálogo con variantes dinámicas, ventas digitales/físicas, integración de pagos QR y gestión de devoluciones.Paradigma Arquitectónico: "Backend-Heavy". La base de datos actúa puramente como capa de persistencia y validación de integridad (claves foráneas, constraints UNIQUE/CHECK). Toda la lógica de negocio, cálculos de estado, automatismos de inventario y control de concurrencia residen estrictamente en el Backend (NestJS + Prisma).  
2. Stack Tecnológico
Frontend: Next.js (App Router) + TypeScript + Tailwind CSS.
Backend: NestJS + Prisma ORM.
Base de Datos: PostgreSQL 15+ (usando la extensión citext).  
Caché: Redis (sesiones, carritos temporales).
Infraestructura: Monorepo (Turborepo + pnpm), Docker Compose, VPS.
Pagos: Integración API Banco BISA (QR).
3. Seguridad y Control de Acceso (RBAC)
El control de acceso es dinámico y gestionado en base de datos.
Entidades: Roles y Permisos se relacionan mediante una tabla intermedia roles_permisos.  
Roles Base: Super Usuario, Administrador, Encargado de Ventas, Vendedor, Cliente.
Seguridad de IDs: Las entidades expuestas públicamente utilizan un public_id (UUIDv4) para evitar la enumeración de recursos por parte de atacantes, mientras internamente se usa BIGINT para optimizar los JOINs.  
4. Gestión de Usuarios y CRM
Unifica el manejo del staff interno y los clientes finales.
Usuarios: Tabla central que contiene las credenciales (email validado con citext, password hasheado) y el ID público.  
Clientes: Extensión del usuario. Clasificados mediante tipo_cliente_enum en 'MINORISTA', 'MAYORISTA' o 'COLEGIO'.  
Sistema de Referidos: Los códigos de referido (codigo_referido) son una herramienta exclusiva para los usuarios del sistema (staff), quienes pueden asignarlos a los clientes para seguimiento.  
Guest Checkout: El sistema soporta compras sin registro. Si un usuario compra como invitado, sus datos (contacto, envío, facturación) viven encapsulados puramente en el `pedido` sin crear basura en la tabla `usuarios`.
Direcciones: Soportan geolocalización (latitud, longitud). El carrito de compras vive solo en el navegador, guardando la dirección final al concretar la orden.  
5. Catálogo de Productos
Estructura diseñada para soportar alta variabilidad de empaques.
Marcas y Categorías: Jerarquía multinivel (categorías padre e hija).  
Productos Base: Definen la naturaleza (Libro, Cuaderno, Papel) y un precio_base.  
Atributos Dinámicos: La tabla de productos utiliza una columna JSONB indexada con GIN para almacenar características variables (tapa, tamaño, hojas) exclusivas de los cuadernos u otros ítems complejos.  
Presentaciones: Separa el producto físico de su empaque (Unidad, Paquete, Caja, Palet). Incluye un multiplicador_unidades y su propio precio y código de barras.  
6. Inventario y Kardex (Módulo Crítico)
Toda entrada y salida de mercancía requiere un registro inmutable.
Control Base: El inventario se mide exclusivamente en unidades base. Mantiene el stock_actual, stock_reservado, stock_minimo, stock_maximo y el costo_promedio. El "Stock Disponible" real para la venta es siempre (stock_actual - stock_reservado).
Kardex (Movimientos): La tabla movimientos_inventario exige el registro de la cantidad, el tipo de movimiento ('ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'MERMA'), el stock resultante y el ID del documento que generó el cambio (Pedido, Orden de Compra, Devolución).
Responsabilidad del Backend: NestJS debe asegurar atómicamente (Prisma $transaction) que al cambiar el stock, se inserte obligatoriamente el registro en el Kardex. Para pagos por QR, el sistema utiliza "Reserva Estricta": al generar el QR, se incrementa el stock_reservado durante 15 minutos para evitar sobreventa (concurrencia). Si expira, un cronjob/webhook libera la reserva.
7. Abastecimiento (Órdenes de Compra)
Gestión interna para reabastecer el inventario.
Proveedores: Catálogo de empresas proveedoras con control de NIT y datos de contacto.  
Órdenes: Fluyen a través de estados específicos definidos en estado_orden_compra_enum ('BORRADOR', 'PENDIENTE', 'APROBADA', 'RECIBIDA_PARCIAL', 'RECIBIDA', 'CANCELADA').  
Registro Financiero: Las compras calculan el costo de los productos y los gastos logísticos asociados (costo_transporte) para impactar correctamente el costo promedio en el inventario.  
8. Flujo de Ventas, Pedidos y Donaciones
Motor principal de ingresos del sistema.
Naturaleza del Pedido: Tipificados mediante tipo_pedido_enum como 'VENTA' o 'DONACION'. Las donaciones requieren almacenar el ID del usuario aprobador y una justificación textual.  
Estados del Pedido: 'PENDIENTE_PAGO', 'PAGADO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO', 'DEVUELTO_PARCIAL', 'DEVUELTO', 'CANCELADO'. El historial de cambios de estado se guarda en la tabla pedido_historial.  
Precios Flexibles (POS): Cada ítem del pedido captura el precio_unitario_catalogo y el precio_unitario_aplicado, permitiendo rebajas en punto de venta sin modificar el precio maestro.  
Integridad de Datos: Al concretar una venta, se crea un snapshot JSONB de la dirección de envío y nombres de productos, asegurando que el recibo histórico sea inmutable ante futuros cambios en el catálogo.  
9. Pagos QR e Idempotencia
Gestión financiera externa con Banco BISA.
Estados de Pago: 'PENDIENTE', 'QR_GENERADO', 'CONFIRMADO', 'RECHAZADO', 'EXPIRADO', 'ANULADO'.  
Prevención de Duplicados: La tabla pagos exige una clave_idempotencia única. El backend debe generar y validar esta clave para evitar que un Webhook repetido procese el mismo pago dos veces.  
10. Devoluciones (RMA)
Módulo completo de logística inversa.
Resolución Comercial: Se define si la acción será 'REEMBOLSO', 'CAMBIO' o 'SIN_COMPENSACION'.  
Destino Logístico: Determina el estado del producto físico devuelto ('NUEVO', 'DANADO') y si el ítem será 'DEVUELTO_INVENTARIO', 'DADO_BAJA' o puesto en 'REVISION'.  
11. Cupones de Descuento
Motor promocional.
Reglas Flexibles: Soportan 'PORCENTAJE' (limitado matemáticamente a no superar el 100%) o 'MONTO_FIJO'. Exigen fechas de vigencia y montos mínimos de compra.  
Control de Uso: Tienen límites globales e individuales (limite_usos_global, limite_usos_por_cliente). El backend es responsable de validar estos límites antes de aplicar el cupón.  
12. Auditoría del Sistema (Bitácora)
Caja negra de seguridad.
Estructura: La tabla bitacora captura el usuario, IP (INET), user_agent, request_id y el origen de la petición.  
Datos Históricos: Guarda estados JSONB representativos de los datos anteriores (datos_anteriores) y nuevos (datos_nuevos).  
Responsabilidad: Al no existir triggers automáticos, el backend debe insertar explícitamente un registro en esta tabla cada vez que una operación comercial o de seguridad crítica se ejecute.  
