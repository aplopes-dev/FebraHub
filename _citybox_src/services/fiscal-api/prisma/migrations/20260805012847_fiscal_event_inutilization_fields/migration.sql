-- AlterTable
-- fiscal_document_id vira nullable — eventos INUTILIZATION (T065) não têm um
-- FiscalDocument (número nunca emitido, data-model.md "FiscalEvent de
-- inutilização vs. FiscalSequence"). Novas colunas (só preenchidas para
-- INUTILIZATION) guardam a faixa de numeração inutilizada.
ALTER TABLE "fiscal_events"
  ALTER COLUMN "fiscal_document_id" DROP NOT NULL,
  ADD COLUMN     "company_id" UUID,
  ADD COLUMN     "series" TEXT,
  ADD COLUMN     "number_range_start" BIGINT,
  ADD COLUMN     "number_range_end" BIGINT;

-- CreateIndex
CREATE INDEX "fiscal_events_company_id_series_idx" ON "fiscal_events"("company_id", "series");

-- AddForeignKey
ALTER TABLE "fiscal_events" ADD CONSTRAINT "fiscal_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
