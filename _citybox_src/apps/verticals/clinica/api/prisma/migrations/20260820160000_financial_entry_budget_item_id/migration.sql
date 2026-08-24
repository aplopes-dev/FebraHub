-- AlterTable
ALTER TABLE "clinica"."financial_entries"
  ADD COLUMN "budget_item_id" TEXT;

-- CreateIndex
CREATE INDEX "financial_entries_store_id_patient_id_budget_item_id_idx"
  ON "clinica"."financial_entries"("store_id", "patient_id", "budget_item_id");

-- AddForeignKey
ALTER TABLE "clinica"."financial_entries"
  ADD CONSTRAINT "financial_entries_budget_item_id_fkey"
  FOREIGN KEY ("budget_item_id") REFERENCES "clinica"."budget_items"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
