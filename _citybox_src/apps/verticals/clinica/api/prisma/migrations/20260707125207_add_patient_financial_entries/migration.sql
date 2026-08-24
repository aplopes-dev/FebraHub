-- CreateEnum
CREATE TYPE "PatientFinancialEntryStatus" AS ENUM ('pending', 'received');

-- CreateEnum
CREATE TYPE "PatientFinancialEntrySource" AS ENUM ('budget_approve', 'avulso_debit');

-- CreateTable
CREATE TABLE "patient_financial_entries" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "value_cents" INTEGER NOT NULL,
    "status" "PatientFinancialEntryStatus" NOT NULL DEFAULT 'pending',
    "source" "PatientFinancialEntrySource" NOT NULL,
    "budget_id" TEXT,
    "installment_index" INTEGER,
    "received_at" DATE,
    "debit_detail" JSONB,
    "receive_detail" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_financial_entries_store_id_patient_id_idx" ON "patient_financial_entries"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_financial_entries_store_id_patient_id_status_idx" ON "patient_financial_entries"("store_id", "patient_id", "status");

-- CreateIndex
CREATE INDEX "patient_financial_entries_store_id_patient_id_date_idx" ON "patient_financial_entries"("store_id", "patient_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "patient_financial_entries_store_id_budget_id_installment_in_key" ON "patient_financial_entries"("store_id", "budget_id", "installment_index");

-- AddForeignKey
ALTER TABLE "patient_financial_entries" ADD CONSTRAINT "patient_financial_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_financial_entries" ADD CONSTRAINT "patient_financial_entries_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
