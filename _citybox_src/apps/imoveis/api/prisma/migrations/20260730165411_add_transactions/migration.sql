-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENTAL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'PROPOSAL', 'CONTRACT_SIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SplitSource" AS ENUM ('GLOBAL', 'AGENT_OVERRIDE', 'MANUAL');

-- CreateEnum
CREATE TYPE "RentalPayoutStatus" AS ENUM ('AWAITING_PAYMENT', 'PAID_BY_TENANT', 'READY_FOR_PAYOUT', 'PAID_TO_LANDLORD');

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "title" TEXT NOT NULL,
    "property_id" TEXT,
    "property_name" TEXT NOT NULL,
    "lead_id" TEXT,
    "lead_name" TEXT,
    "captor_id" TEXT NOT NULL,
    "seller_id" TEXT,
    "gross_value_cents" INTEGER NOT NULL,
    "commission_percent" DOUBLE PRECISION NOT NULL,
    "agency_percent" DOUBLE PRECISION NOT NULL,
    "captor_percent" DOUBLE PRECISION NOT NULL,
    "seller_percent" DOUBLE PRECISION NOT NULL,
    "agency_amount_cents" INTEGER NOT NULL,
    "captor_amount_cents" INTEGER NOT NULL,
    "seller_amount_cents" INTEGER NOT NULL,
    "total_commission_cents" INTEGER NOT NULL,
    "split_others" JSONB NOT NULL DEFAULT '[]',
    "split_source" "SplitSource" NOT NULL,
    "rental_landlord_name" TEXT,
    "rental_tenant_name" TEXT,
    "rental_base_rent_cents" INTEGER,
    "rental_condo_cents" INTEGER,
    "rental_iptu_cents" INTEGER,
    "rental_admin_fee_percent" DOUBLE PRECISION,
    "rental_due_day" INTEGER,
    "rental_payout_status" "RentalPayoutStatus",
    "rental_received_cents" INTEGER,
    "rental_deductions" JSONB,
    "rental_paid_at" DATE,
    "rental_payout_at" DATE,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_activities" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "at" DATE NOT NULL,
    "actor_name" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_configs" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "default_commission_percent" DOUBLE PRECISION NOT NULL,
    "agency_percent" DOUBLE PRECISION NOT NULL,
    "captor_percent" DOUBLE PRECISION NOT NULL,
    "seller_percent" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commission_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_agent_overrides" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "captor_percent_override" DOUBLE PRECISION NOT NULL,
    "seller_percent_override" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_agent_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_store_id_created_at_idx" ON "transactions"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "transactions_store_id_status_idx" ON "transactions"("store_id", "status");

-- CreateIndex
CREATE INDEX "transactions_store_id_type_idx" ON "transactions"("store_id", "type");

-- CreateIndex
CREATE INDEX "transactions_store_id_captor_id_idx" ON "transactions"("store_id", "captor_id");

-- CreateIndex
CREATE INDEX "transactions_store_id_seller_id_idx" ON "transactions"("store_id", "seller_id");

-- CreateIndex
CREATE INDEX "transaction_activities_transaction_id_at_idx" ON "transaction_activities"("transaction_id", "at");

-- CreateIndex
CREATE UNIQUE INDEX "commission_configs_store_id_key" ON "commission_configs"("store_id");

-- CreateIndex
CREATE INDEX "commission_agent_overrides_config_id_idx" ON "commission_agent_overrides"("config_id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_agent_overrides_store_id_agent_id_key" ON "commission_agent_overrides"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "expenses_store_id_date_idx" ON "expenses"("store_id", "date");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_activities" ADD CONSTRAINT "transaction_activities_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_agent_overrides" ADD CONSTRAINT "commission_agent_overrides_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "commission_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
