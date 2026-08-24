-- CreateEnum
CREATE TYPE "FinancialEntryType" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "FinancialEntryStatus" AS ENUM ('pending', 'paid', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "FinancialEntrySource" AS ENUM ('manual', 'appointment_complete');

-- CreateEnum
CREATE TYPE "FinancialCategoryKind" AS ENUM ('income', 'expense');

-- CreateTable
CREATE TABLE "financial_accounts" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'checking',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_categories" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "kind" "FinancialCategoryKind" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
    "client_id" TEXT,
    "appointment_id" TEXT,
    "installment_number" INTEGER,
    "total_installments" INTEGER,
    "recurrence_group_id" TEXT,
    "receive_detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
CREATE UNIQUE INDEX "financial_entries_appointment_id_key" ON "financial_entries"("appointment_id");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_due_date_idx" ON "financial_entries"("store_id", "due_date");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_type_status_idx" ON "financial_entries"("store_id", "type", "status");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_client_id_idx" ON "financial_entries"("store_id", "client_id");

-- CreateIndex
CREATE INDEX "financial_entries_store_id_recurrence_group_id_idx" ON "financial_entries"("store_id", "recurrence_group_id");

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_expense_category_id_fkey" FOREIGN KEY ("expense_category_id") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_income_category_id_fkey" FOREIGN KEY ("income_category_id") REFERENCES "financial_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
