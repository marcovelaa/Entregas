-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('SIMPLE', 'COMBO', 'SERVICIO');

-- CreateEnum
CREATE TYPE "TipoDescuento" AS ENUM ('PORCENTAJE', 'MONTO_FIJO', 'MONTO_FIJO_POR_UNIDAD', 'COMBO', 'LLEVA_X_PAGA_Y');

-- CreateEnum
CREATE TYPE "AlcanceDescuento" AS ENUM ('GLOBAL', 'CATEGORIA', 'PRODUCTO', 'VARIANTE', 'EMPAQUE');

-- CreateEnum
CREATE TYPE "CanalDescuento" AS ENUM ('POS', 'ECOMMERCE', 'TODOS');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "rol_id" BIGINT NOT NULL,
    "nombres" VARCHAR(120) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(30),
    "password_hash" TEXT NOT NULL,
    "codigo_referido" VARCHAR(50),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "codigo" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "rol_id" BIGINT NOT NULL,
    "permiso_codigo" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("rol_id","permiso_codigo")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT,
    "ip" INET,
    "user_agent" TEXT,
    "entidad" VARCHAR(50) NOT NULL,
    "entidad_id" VARCHAR(50),
    "operacion" VARCHAR(50) NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" BIGSERIAL NOT NULL,
    "categoria_padre_id" BIGINT,
    "nombre" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "plantilla_atributos" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" BIGSERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "categoria_id" BIGINT NOT NULL,
    "marca_id" BIGINT,
    "sku" VARCHAR(255) NOT NULL,
    "nombre" VARCHAR(220) NOT NULL,
    "descripcion" TEXT,
    "naturaleza" VARCHAR(80),
    "tipo_producto" "TipoProducto" NOT NULL DEFAULT 'SIMPLE',
    "unidad_medida" VARCHAR(40) NOT NULL DEFAULT 'UNIDAD',
    "atributos" JSONB NOT NULL DEFAULT '{}',
    "precio_base" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "precio_promocional" DECIMAL(14,2),
    "opciones_variantes" JSONB NOT NULL DEFAULT '[]',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "url" TEXT NOT NULL,
    "texto_alternativo" VARCHAR(255),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variantes" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "sku_base" VARCHAR(255) NOT NULL,
    "codigo_barras" VARCHAR(255),
    "precio_unitario" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "precio_promocional" DECIMAL(14,2),
    "combinacion_opciones" JSONB NOT NULL DEFAULT '{}',
    "imagen_url" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empaques" (
    "id" BIGSERIAL NOT NULL,
    "variante_id" BIGINT NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "sku" VARCHAR(255) NOT NULL,
    "codigo_barras" VARCHAR(255),
    "multiplicador_unidades" INTEGER NOT NULL DEFAULT 1,
    "precio" DECIMAL(14,2) NOT NULL,
    "precio_promocional" DECIMAL(14,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empaques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_componentes" (
    "id" BIGSERIAL NOT NULL,
    "combo_producto_id" BIGINT NOT NULL,
    "componente_prod_id" BIGINT NOT NULL,
    "variante_id" BIGINT,
    "empaque_id" BIGINT,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_componentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "variante_id" BIGINT,
    "cantidad_disponible" INTEGER NOT NULL DEFAULT 0,
    "reservado" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 5,
    "ubicacion" VARCHAR(120),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" BIGSERIAL NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "variante_id" BIGINT,
    "tipo_movimiento" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "motivo" TEXT,
    "usuario_id" BIGINT,
    "tipo_documento_origen" TEXT,
    "documento_origen_id" BIGINT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "contacto" VARCHAR(255),
    "telefono" VARCHAR(50),
    "direccion" TEXT,
    "email" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compras" (
    "id" BIGSERIAL NOT NULL,
    "proveedor_id" BIGINT,
    "usuario_id" BIGINT,
    "numero_nota" VARCHAR(100) NOT NULL DEFAULT 'S/N',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'COMPLETADO',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra_detalles" (
    "id" BIGSERIAL NOT NULL,
    "compra_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "variante_id" BIGINT,
    "empaque_id" BIGINT,
    "cantidad" INTEGER NOT NULL,
    "precio_costo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "compra_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL DEFAULT 'Cliente Generico',
    "documento_id" VARCHAR(50),
    "email" VARCHAR(255),
    "telefono" VARCHAR(50),
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" BIGSERIAL NOT NULL,
    "cliente_id" BIGINT,
    "usuario_id" BIGINT NOT NULL,
    "numero_ticket" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'COMPLETADA',
    "motivo_anulacion" TEXT,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "descuento_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "codigo_cupon" VARCHAR(100),
    "metodo_pago" VARCHAR(50) NOT NULL DEFAULT 'EFECTIVO',
    "monto_pagado" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "vuelto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_detalles" (
    "id" BIGSERIAL NOT NULL,
    "venta_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "variante_id" BIGINT,
    "empaque_id" BIGINT,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "venta_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuentos" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "codigo_cupon" VARCHAR(100),
    "tipo" "TipoDescuento" NOT NULL DEFAULT 'PORCENTAJE',
    "valor" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "max_monto_descuento" DECIMAL(14,2),
    "alcance" "AlcanceDescuento" NOT NULL DEFAULT 'GLOBAL',
    "canal" "CanalDescuento" NOT NULL DEFAULT 'TODOS',
    "cantidad_requerida" INTEGER NOT NULL DEFAULT 1,
    "cantidad_paga" INTEGER NOT NULL DEFAULT 1,
    "monto_minimo_compra" DECIMAL(14,2),
    "limite_usos" INTEGER,
    "limite_usos_por_cliente" INTEGER DEFAULT 1,
    "usos_actuales" INTEGER NOT NULL DEFAULT 0,
    "es_acumulable" BOOLEAN NOT NULL DEFAULT false,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "descuentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento_productos" (
    "id" BIGSERIAL NOT NULL,
    "descuento_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,

    CONSTRAINT "descuento_productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento_variantes" (
    "id" BIGSERIAL NOT NULL,
    "descuento_id" BIGINT NOT NULL,
    "variante_id" BIGINT NOT NULL,

    CONSTRAINT "descuento_variantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento_empaques" (
    "id" BIGSERIAL NOT NULL,
    "descuento_id" BIGINT NOT NULL,
    "empaque_id" BIGINT NOT NULL,

    CONSTRAINT "descuento_empaques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento_categorias" (
    "id" BIGSERIAL NOT NULL,
    "descuento_id" BIGINT NOT NULL,
    "categoria_id" BIGINT NOT NULL,

    CONSTRAINT "descuento_categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descuento_usos" (
    "id" BIGSERIAL NOT NULL,
    "descuento_id" BIGINT NOT NULL,
    "venta_id" BIGINT NOT NULL,
    "cliente_id" BIGINT,
    "monto_descontado" DECIMAL(14,2) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "descuento_usos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_public_id_key" ON "usuarios"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigo_referido_key" ON "usuarios"("codigo_referido");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_slug_key" ON "marcas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_slug_key" ON "categorias"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "productos_public_id_key" ON "productos"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "producto_imagenes_producto_id_url_key" ON "producto_imagenes"("producto_id", "url");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_sku_base_key" ON "variantes"("sku_base");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_codigo_barras_key" ON "variantes"("codigo_barras");

-- CreateIndex
CREATE UNIQUE INDEX "variantes_producto_id_nombre_key" ON "variantes"("producto_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "empaques_sku_key" ON "empaques"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "empaques_codigo_barras_key" ON "empaques"("codigo_barras");

-- CreateIndex
CREATE UNIQUE INDEX "empaques_variante_id_nombre_key" ON "empaques"("variante_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_producto_id_variante_id_ubicacion_key" ON "inventario"("producto_id", "variante_id", "ubicacion");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_id_key" ON "clientes"("documento_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_numero_ticket_key" ON "ventas"("numero_ticket");

-- CreateIndex
CREATE UNIQUE INDEX "descuentos_codigo_cupon_key" ON "descuentos"("codigo_cupon");

-- CreateIndex
CREATE UNIQUE INDEX "descuento_productos_descuento_id_producto_id_key" ON "descuento_productos"("descuento_id", "producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "descuento_variantes_descuento_id_variante_id_key" ON "descuento_variantes"("descuento_id", "variante_id");

-- CreateIndex
CREATE UNIQUE INDEX "descuento_empaques_descuento_id_empaque_id_key" ON "descuento_empaques"("descuento_id", "empaque_id");

-- CreateIndex
CREATE UNIQUE INDEX "descuento_categorias_descuento_id_categoria_id_key" ON "descuento_categorias"("descuento_id", "categoria_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_codigo_fkey" FOREIGN KEY ("permiso_codigo") REFERENCES "permisos"("codigo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_categoria_padre_id_fkey" FOREIGN KEY ("categoria_padre_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantes" ADD CONSTRAINT "variantes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empaques" ADD CONSTRAINT "empaques_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_componentes" ADD CONSTRAINT "producto_componentes_combo_producto_id_fkey" FOREIGN KEY ("combo_producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_componentes" ADD CONSTRAINT "producto_componentes_componente_prod_id_fkey" FOREIGN KEY ("componente_prod_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_componentes" ADD CONSTRAINT "producto_componentes_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_componentes" ADD CONSTRAINT "producto_componentes_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compras" ADD CONSTRAINT "compras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_detalles" ADD CONSTRAINT "compra_detalles_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_detalles" ADD CONSTRAINT "venta_detalles_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_productos" ADD CONSTRAINT "descuento_productos_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_productos" ADD CONSTRAINT "descuento_productos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_variantes" ADD CONSTRAINT "descuento_variantes_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_variantes" ADD CONSTRAINT "descuento_variantes_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_empaques" ADD CONSTRAINT "descuento_empaques_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_empaques" ADD CONSTRAINT "descuento_empaques_empaque_id_fkey" FOREIGN KEY ("empaque_id") REFERENCES "empaques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_categorias" ADD CONSTRAINT "descuento_categorias_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_categorias" ADD CONSTRAINT "descuento_categorias_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_usos" ADD CONSTRAINT "descuento_usos_descuento_id_fkey" FOREIGN KEY ("descuento_id") REFERENCES "descuentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_usos" ADD CONSTRAINT "descuento_usos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "descuento_usos" ADD CONSTRAINT "descuento_usos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

