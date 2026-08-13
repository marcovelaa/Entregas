-- AlterTable
ALTER TABLE "clientes" ADD COLUMN "password_hash" TEXT;

-- CreateTable
CREATE TABLE "direcciones" (
    "id" BIGSERIAL NOT NULL,
    "cliente_id" BIGINT NOT NULL,
    "alias" VARCHAR(100) NOT NULL,
    "destinatario_nombre" VARCHAR(255) NOT NULL,
    "destinatario_apellidos" VARCHAR(255) NOT NULL,
    "direccion_completa" TEXT NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "telefono" VARCHAR(50) NOT NULL,
    "referencia" TEXT,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_reset_tokens" (
    "id" BIGSERIAL NOT NULL,
    "cliente_id" BIGINT NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direcciones_cliente_id_idx" ON "direcciones"("cliente_id");
CREATE INDEX "cliente_reset_tokens_cliente_id_idx" ON "cliente_reset_tokens"("cliente_id");
CREATE UNIQUE INDEX "cliente_reset_tokens_token_hash_key" ON "cliente_reset_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "direcciones" ADD CONSTRAINT "direcciones_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cliente_reset_tokens" ADD CONSTRAINT "cliente_reset_tokens_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
