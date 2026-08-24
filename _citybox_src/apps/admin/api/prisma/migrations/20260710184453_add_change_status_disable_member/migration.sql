-- DropIndex (IF EXISTS: índice já foi removido antes desta migration no banco real)
DROP INDEX IF EXISTS "invoices_stripe_invoice_id_key";

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "plan_prices" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
-- Reaponta para a tabela global `members`: após a migration 20260710043632 os
-- campos de usuário (incl. status/senha provisória) vivem em `members`, não no
-- vínculo N:N `store_members`.
ALTER TABLE "members" ADD COLUMN     "disabled_at" TIMESTAMPTZ(3),
ADD COLUMN     "provisional_expires_at" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" DROP DEFAULT;
