-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('active', 'won', 'cancelled');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM (
  'awaiting_property',
  'property_selected',
  'contract_sent',
  'contract_signed',
  'payment_confirmed',
  'handover'
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "property_id" TEXT,
    "property_name" TEXT NOT NULL DEFAULT '',
    "lead_name" TEXT,
    "type" "TransactionType",
    "status" "DealStatus" NOT NULL DEFAULT 'active',
    "stage" "DealStage" NOT NULL DEFAULT 'awaiting_property',
    "title" TEXT NOT NULL DEFAULT '',
    "agent_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deals_store_id_created_at_idx" ON "deals"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "deals_store_id_status_idx" ON "deals"("store_id", "status");

-- CreateIndex
CREATE INDEX "deals_store_id_stage_idx" ON "deals"("store_id", "stage");

-- CreateIndex
CREATE INDEX "deals_lead_id_idx" ON "deals"("lead_id");

-- CreateIndex
CREATE INDEX "deals_property_id_idx" ON "deals"("property_id");

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "deal_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_deal_id_key" ON "transactions"("deal_id");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
