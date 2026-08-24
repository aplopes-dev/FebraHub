-- CreateEnum
CREATE TYPE "FinancialGroupType" AS ENUM ('receita', 'despesa');

-- CreateEnum
CREATE TYPE "CardContractGrouping" AS ENUM ('by_card_brand', 'by_payment_method', 'no_grouping');

-- CreateEnum
CREATE TYPE "CardCutoffPeriod" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "CardDayType" AS ENUM ('business_days', 'calendar_days');

-- CreateEnum
CREATE TYPE "CardInstallmentDayType" AS ENUM ('business_days', 'calendar_days', 'single_payment');

-- CreateEnum
CREATE TYPE "CardPaymentMethodType" AS ENUM ('pix', 'debit', 'credit');

-- CreateTable
CREATE TABLE "financial_groups" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinancialGroupType" NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "financial_group_id" TEXT NOT NULL,
    "available_for_pdv" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_contracts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "grouping" "CardContractGrouping" NOT NULL DEFAULT 'no_grouping',
    "cutoff_period" "CardCutoffPeriod" NOT NULL DEFAULT 'daily',
    "first_payment_day_type" "CardDayType" NOT NULL DEFAULT 'business_days',
    "installment_day_type" "CardInstallmentDayType" NOT NULL DEFAULT 'business_days',
    "business_days_only" BOOLEAN NOT NULL DEFAULT true,
    "deposit_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "anticipation_periods" INTEGER NOT NULL DEFAULT 0,
    "anticipation_rate" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "all_entries_paid_in_contract" BOOLEAN NOT NULL DEFAULT false,
    "business_days_deposit" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "card_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_payment_methods" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "card_contract_id" TEXT NOT NULL,
    "type" "CardPaymentMethodType" NOT NULL,
    "brand" TEXT,
    "rate" DECIMAL(9,4),
    "fee_cents" INTEGER,
    "settlement_days" INTEGER,
    "min_installments" INTEGER,
    "max_installments" INTEGER,
    "first_payment_days" INTEGER,
    "days_between_installments" INTEGER,
    "progressive_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "card_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_rate_tiers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "card_payment_method_id" TEXT NOT NULL,
    "min_installments" INTEGER NOT NULL,
    "max_installments" INTEGER NOT NULL,
    "rate" DECIMAL(9,4) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "card_rate_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_groups_organization_id_deleted_at_idx" ON "financial_groups"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "financial_groups_organization_id_type_idx" ON "financial_groups"("organization_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "financial_groups_organization_id_name_key" ON "financial_groups"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "financial_groups_id_organization_id_key" ON "financial_groups"("id", "organization_id");

-- CreateIndex
CREATE INDEX "chart_of_accounts_organization_id_deleted_at_idx" ON "chart_of_accounts"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "chart_of_accounts_financial_group_id_idx" ON "chart_of_accounts"("financial_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_organization_id_name_key" ON "chart_of_accounts"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_id_organization_id_key" ON "chart_of_accounts"("id", "organization_id");

-- CreateIndex
CREATE INDEX "cost_centers_organization_id_deleted_at_idx" ON "cost_centers"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_organization_id_name_key" ON "cost_centers"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_id_organization_id_key" ON "cost_centers"("id", "organization_id");

-- CreateIndex
CREATE INDEX "card_contracts_organization_id_deleted_at_idx" ON "card_contracts"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "card_contracts_organization_id_active_idx" ON "card_contracts"("organization_id", "active");

-- CreateIndex
CREATE INDEX "card_contracts_bank_account_id_idx" ON "card_contracts"("bank_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_contracts_id_organization_id_key" ON "card_contracts"("id", "organization_id");

-- CreateIndex
CREATE INDEX "card_payment_methods_organization_id_idx" ON "card_payment_methods"("organization_id");

-- CreateIndex
CREATE INDEX "card_payment_methods_card_contract_id_idx" ON "card_payment_methods"("card_contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_payment_methods_id_organization_id_key" ON "card_payment_methods"("id", "organization_id");

-- CreateIndex
CREATE INDEX "card_rate_tiers_organization_id_idx" ON "card_rate_tiers"("organization_id");

-- CreateIndex
CREATE INDEX "card_rate_tiers_card_payment_method_id_idx" ON "card_rate_tiers"("card_payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_rate_tiers_id_organization_id_key" ON "card_rate_tiers"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "financial_groups" ADD CONSTRAINT "financial_groups_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_financial_group_id_organization_id_fkey" FOREIGN KEY ("financial_group_id", "organization_id") REFERENCES "financial_groups"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_contracts" ADD CONSTRAINT "card_contracts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_contracts" ADD CONSTRAINT "card_contracts_bank_account_id_organization_id_fkey" FOREIGN KEY ("bank_account_id", "organization_id") REFERENCES "bank_accounts"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_payment_methods" ADD CONSTRAINT "card_payment_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_payment_methods" ADD CONSTRAINT "card_payment_methods_card_contract_id_organization_id_fkey" FOREIGN KEY ("card_contract_id", "organization_id") REFERENCES "card_contracts"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_rate_tiers" ADD CONSTRAINT "card_rate_tiers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_rate_tiers" ADD CONSTRAINT "card_rate_tiers_card_payment_method_id_organization_id_fkey" FOREIGN KEY ("card_payment_method_id", "organization_id") REFERENCES "card_payment_methods"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
