/*
  Warnings:

  - You are about to drop the `patient_financial_entries` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FinancialEntryType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "FinancialEntryStatus" AS ENUM ('pending', 'paid', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "FinancialEntrySource" AS ENUM ('manual', 'budget_approve', 'avulso_debit');

-- CreateEnum
CREATE TYPE "FinancialCategoryKind" AS ENUM ('income', 'expense');

-- DropForeignKey
ALTER TABLE "patient_financial_entries" DROP CONSTRAINT "patient_financial_entries_budget_id_fkey";

-- DropForeignKey
ALTER TABLE "patient_financial_entries" DROP CONSTRAINT "patient_financial_entries_patient_id_fkey";

-- DropTable
DROP TABLE "patient_financial_entries";

-- DropEnum
DROP TYPE "PatientFinancialEntrySource";

-- DropEnum
DROP TYPE "PatientFinancialEntryStatus";

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'checking',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "kind" "FinancialCategoryKind" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entries" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "type" "FinancialEntryType" NOT NULL,
    "status" "FinancialEntryStatus" NOT NULL DEFAULT 'pending',
    "source" "FinancialEntrySource" NOT NULL,
    "description" TEXT NOT NULL,
    "value_cents" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "paid_at" DATE,
    "paid_value_cents" INTEGER,
    "payment_method" TEXT,
    "payment_type" TEXT,
    "observation" TEXT,
    "account_id" TEXT,
    "expense_category_id" TEXT,
    "income_category_id" TEXT,
    "patient_id" TEXT,
    "budget_id" TEXT,
    "installment_index" INTEGER,
    "installment_number" INTEGER,
    "total_installments" INTEGER,
    "recurrence_group_id" TEXT,
    "debit_detail" JSONB,
    "receive_detail" JSONB,
    "receipt_object_key" VARCHAR(512),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_accounts_store_id_idx" ON "financial_accounts"("store_id");

-- CreateIndex
CREATE INDEX "financial_accounts_store_id_is_active_idx" ON "financial_accounts"("store_id", "is_active");

-- CreateIndex
CREATE INDEX "financial_categories_store_id_idx" ON "financial_categories"("store_id");

-- CreateIndex
CREATE INDEX "financial_categories_store_id_kind_idx" ON "financial_categories"("store_id", "kind");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_due_date_idx" ON "financial_entries"("store_id", "due_date");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_patient_id_idx" ON "financial_entries"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_patient_id_status_idx" ON "financial_entries"("store_id", "patient_id", "status");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_type_status_idx" ON "financial_entries"("store_id", "type", "status");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_recurrence_group_id_idx" ON "financial_entries"("store_id", "recurrence_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entries_store_id_budget_id_installment_index_key" ON "financial_entries"("store_id", "budget_id", "installment_index");

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_income_category_id_fkey" FOREIGN KEY ("income_category_id") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
