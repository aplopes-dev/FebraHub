-- CreateEnum
CREATE TYPE "imoveis"."LeadPaymentIntent" AS ENUM (
  'cash',
  'financing',
  'fgts',
  'trade_in'
);

-- AlterTable
ALTER TABLE "imoveis"."leads"
ADD COLUMN "payment_intents" "imoveis"."LeadPaymentIntent"[] NOT NULL DEFAULT ARRAY[]::"imoveis"."LeadPaymentIntent"[];
