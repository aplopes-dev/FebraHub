-- CreateEnum
CREATE TYPE "BankStatementStatus" AS ENUM ('not_reconciled', 'partially_reconciled', 'reconciled');

-- CreateEnum
CREATE TYPE "BankStatementTransactionStatus" AS ENUM ('pending', 'reconciled', 'discarded');

-- CreateEnum
CREATE TYPE "BankStatementTransactionKind" AS ENUM ('credit', 'debit');

-- CreateTable
CREATE TABLE "bank_statements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL DEFAULT '',
    "bank_code" TEXT NOT NULL DEFAULT '',
    "branch_number" TEXT NOT NULL DEFAULT '',
    "account_number" TEXT NOT NULL DEFAULT '',
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" "BankStatementStatus" NOT NULL DEFAULT 'not_reconciled',
    "pending_count" INTEGER NOT NULL DEFAULT 0,
    "reconciled_count" INTEGER NOT NULL DEFAULT 0,
    "discarded_count" INTEGER NOT NULL DEFAULT 0,
    "file_name" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "imported_by_name" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_transactions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "bank_statement_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "fit_id" TEXT NOT NULL DEFAULT '',
    "dedupe_key" TEXT NOT NULL,
    "posted_at" DATE NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "kind" "BankStatementTransactionKind" NOT NULL,
    "transaction_type" TEXT NOT NULL DEFAULT '',
    "memo" TEXT NOT NULL DEFAULT '',
    "status" "BankStatementTransactionStatus" NOT NULL DEFAULT 'pending',
    "reconciled_at" TIMESTAMPTZ(3),
    "discarded_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_statement_matches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "bank_statement_transaction_id" TEXT NOT NULL,
    "financial_entry_id" TEXT NOT NULL,
    "financial_entry_payment_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statement_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_statements_organization_id_bank_account_id_created_at_idx" ON "bank_statements"("organization_id", "bank_account_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statements_id_organization_id_key" ON "bank_statements"("id", "organization_id");

-- CreateIndex
CREATE INDEX "bank_statement_transactions_organization_id_bank_statement__idx" ON "bank_statement_transactions"("organization_id", "bank_statement_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_transactions_id_organization_id_key" ON "bank_statement_transactions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_transactions_bank_account_id_dedupe_key_key" ON "bank_statement_transactions"("bank_account_id", "dedupe_key");

-- CreateIndex
CREATE INDEX "bank_statement_matches_organization_id_financial_entry_id_idx" ON "bank_statement_matches"("organization_id", "financial_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_matches_bank_statement_transaction_id_financ_key" ON "bank_statement_matches"("bank_statement_transaction_id", "financial_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_matches_id_organization_id_key" ON "bank_statement_matches"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_bank_account_id_organization_id_fkey" FOREIGN KEY ("bank_account_id", "organization_id") REFERENCES "bank_accounts"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_transactions" ADD CONSTRAINT "bank_statement_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_transactions" ADD CONSTRAINT "bank_statement_transactions_bank_statement_id_organization_fkey" FOREIGN KEY ("bank_statement_id", "organization_id") REFERENCES "bank_statements"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_matches" ADD CONSTRAINT "bank_statement_matches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_matches" ADD CONSTRAINT "bank_statement_matches_bank_statement_transaction_id_organ_fkey" FOREIGN KEY ("bank_statement_transaction_id", "organization_id") REFERENCES "bank_statement_transactions"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_statement_matches" ADD CONSTRAINT "bank_statement_matches_financial_entry_id_organization_id_fkey" FOREIGN KEY ("financial_entry_id", "organization_id") REFERENCES "financial_entries"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
