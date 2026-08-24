SET search_path TO clinica;

ALTER TABLE "patient_contract_emissions"
  ADD COLUMN IF NOT EXISTS "budget_id" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_contract_emissions_budget_id_fkey'
  ) THEN
    ALTER TABLE "patient_contract_emissions"
      ADD CONSTRAINT "patient_contract_emissions_budget_id_fkey"
      FOREIGN KEY ("budget_id") REFERENCES "budgets"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "patient_contract_emissions_store_id_budget_id_key"
  ON "patient_contract_emissions"("store_id", "budget_id");

CREATE INDEX IF NOT EXISTS "patient_contract_emissions_store_id_budget_id_idx"
  ON "patient_contract_emissions"("store_id", "budget_id");
