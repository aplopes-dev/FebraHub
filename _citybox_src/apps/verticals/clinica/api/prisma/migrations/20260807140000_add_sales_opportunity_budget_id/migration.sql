-- AlterEnum
ALTER TYPE "clinica"."SalesOpportunityOrigin" ADD VALUE IF NOT EXISTS 'budget';

-- AlterTable
ALTER TABLE "clinica"."sales_opportunities" ADD COLUMN IF NOT EXISTS "budget_id" TEXT;

-- CreateIndex (1:1 — budgetId unique; multiple NULLs allowed in Postgres)
CREATE UNIQUE INDEX IF NOT EXISTS "sales_opportunities_budget_id_key" ON "clinica"."sales_opportunities"("budget_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sales_opportunities_store_id_budget_id_idx" ON "clinica"."sales_opportunities"("store_id", "budget_id");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_opportunities_budget_id_fkey'
  ) THEN
    ALTER TABLE "clinica"."sales_opportunities"
      ADD CONSTRAINT "sales_opportunities_budget_id_fkey"
      FOREIGN KEY ("budget_id") REFERENCES "clinica"."budgets"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
