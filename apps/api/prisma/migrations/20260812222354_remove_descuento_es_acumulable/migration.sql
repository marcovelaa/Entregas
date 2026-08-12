-- Decision 1.3 (ROADMAP_COMPLETAR_PROYECTO.md): no discount accumulation.
-- Only one discount rule ever applies per sale (the highest-savings match);
-- `es_acumulable` was persisted but never read by the evaluation engine.
ALTER TABLE "descuentos" DROP COLUMN "es_acumulable";
