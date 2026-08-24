-- DropIndex
DROP INDEX "bank_statement_transactions_bank_account_id_dedupe_key_key";

-- AlterTable
ALTER TABLE "bank_statement_transactions" ALTER COLUMN "bank_account_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "bank_statements" ALTER COLUMN "bank_account_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bank_statement_transactions_organization_id_dedupe_key_key" ON "bank_statement_transactions"("organization_id", "dedupe_key");
