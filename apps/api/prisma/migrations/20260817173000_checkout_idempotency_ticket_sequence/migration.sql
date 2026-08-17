-- AddColumn
ALTER TABLE "ventas" ADD COLUMN "idempotency_key" VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "ventas_usuario_id_idempotency_key_key"
ON "ventas"("usuario_id", "idempotency_key");

-- CreateSequence
CREATE SEQUENCE "ventas_numero_ticket_seq" AS BIGINT;

-- Initialize the ticket sequence above every existing numeric POS ticket and sale ID.
-- Existing legacy tickets remain untouched; new POS tickets are allocated atomically.
SELECT setval(
  '"ventas_numero_ticket_seq"',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(
          NULLIF(regexp_replace("numero_ticket", '^TK-', ''), '')::BIGINT
        )
        FROM "ventas"
        WHERE "numero_ticket" ~ '^TK-[0-9]+$'
      ),
      1
    ),
    COALESCE((SELECT MAX("id") FROM "ventas"), 1)
  ),
  EXISTS(SELECT 1 FROM "ventas")
);
