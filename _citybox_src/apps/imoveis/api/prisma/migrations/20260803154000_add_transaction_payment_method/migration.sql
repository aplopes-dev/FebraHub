-- CreateEnum
CREATE TYPE "TransactionPaymentMethod" AS ENUM (
  'pix',
  'transfer',
  'boleto',
  'cash',
  'check',
  'debit',
  'credit',
  'financing',
  'consortium',
  'fgts',
  'other'
);

-- AlterTable
ALTER TABLE "imoveis"."transactions"
ADD COLUMN "payment_method" "TransactionPaymentMethod" NOT NULL DEFAULT 'other';

ALTER TABLE "imoveis"."transactions"
ALTER COLUMN "payment_method" DROP DEFAULT;
