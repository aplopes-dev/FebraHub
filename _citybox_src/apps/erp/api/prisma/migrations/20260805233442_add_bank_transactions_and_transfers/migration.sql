-- CreateEnum
CREATE TYPE "BankTransactionKind" AS ENUM ('initial_balance', 'credit', 'debit');

-- CreateEnum
CREATE TYPE "BankTransactionSourceType" AS ENUM ('initial_balance', 'financial_entry_payment', 'bank_transfer', 'reconciliation');

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "bank_code" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "kind" "BankTransactionKind" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount_cents" INTEGER NOT NULL,
    "effective_at" DATE NOT NULL,
    "source_type" "BankTransactionSourceType" NOT NULL,
    "source_id" TEXT,
    "created_by_name" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transfers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "from_bank_account_id" TEXT NOT NULL,
    "to_bank_account_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "effective_at" DATE NOT NULL,
    "payment_method" TEXT NOT NULL,
    "cost_center_id" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "created_by_name" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_transactions_organization_id_bank_account_id_effective_idx" ON "bank_transactions"("organization_id", "bank_account_id", "effective_at");

-- CreateIndex
CREATE INDEX "bank_transactions_organization_id_source_type_source_id_idx" ON "bank_transactions"("organization_id", "source_type", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_id_organization_id_key" ON "bank_transactions"("id", "organization_id");

-- CreateIndex
CREATE INDEX "bank_transfers_organization_id_from_bank_account_id_idx" ON "bank_transfers"("organization_id", "from_bank_account_id");

-- CreateIndex
CREATE INDEX "bank_transfers_organization_id_to_bank_account_id_idx" ON "bank_transfers"("organization_id", "to_bank_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_transfers_id_organization_id_key" ON "bank_transfers"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bank_account_id_organization_id_fkey" FOREIGN KEY ("bank_account_id", "organization_id") REFERENCES "bank_accounts"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_from_bank_account_id_organization_id_fkey" FOREIGN KEY ("from_bank_account_id", "organization_id") REFERENCES "bank_accounts"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_to_bank_account_id_organization_id_fkey" FOREIGN KEY ("to_bank_account_id", "organization_id") REFERENCES "bank_accounts"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transfers" ADD CONSTRAINT "bank_transfers_cost_center_id_organization_id_fkey" FOREIGN KEY ("cost_center_id", "organization_id") REFERENCES "cost_centers"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
