-- CreateEnum
CREATE TYPE "CommissionPaymentTrigger" AS ENUM ('treatment_completed', 'debit_received', 'budget_approved');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('percentage', 'fixed_value');

-- CreateEnum
CREATE TYPE "CommissionAccrualStatus" AS ENUM ('open', 'paid');

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "member_name" TEXT NOT NULL,
    "payment_trigger" "CommissionPaymentTrigger" NOT NULL,
    "commission_type" "CommissionType" NOT NULL,
    "percentage_value" DOUBLE PRECISION,
    "commission_value_cents" INTEGER,
    "allow_value_exceeds_treatment" BOOLEAN NOT NULL DEFAULT false,
    "plan_id" TEXT,
    "specialty_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rule_treatments" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "treatment_value_cents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "commission_rule_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_accruals" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "member_name" TEXT NOT NULL,
    "rule_id" TEXT,
    "payment_trigger" "CommissionPaymentTrigger" NOT NULL,
    "trigger_label" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL DEFAULT '',
    "specialty_name" TEXT NOT NULL DEFAULT '',
    "treatment_name" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "paid_value_cents" INTEGER NOT NULL,
    "treatment_cost_cents" INTEGER NOT NULL,
    "installment" TEXT,
    "commission_cents" INTEGER NOT NULL,
    "accrued_at" DATE NOT NULL,
    "source_financial_entry_id" TEXT,
    "source_budget_id" TEXT,
    "source_patient_treatment_id" TEXT,
    "status" "CommissionAccrualStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commission_accruals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payments" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "member_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "payment_date" DATE NOT NULL,
    "account_id" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "gross_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "net_cents" INTEGER NOT NULL,
    "observation" TEXT,
    "expense_entry_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "commission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_payment_items" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "accrual_id" TEXT NOT NULL,

    CONSTRAINT "commission_payment_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "commission_rules_store_id_member_id_idx" ON "commission_rules"("store_id", "member_id");

-- CreateIndex
CREATE INDEX "commission_rules_store_id_member_id_payment_trigger_idx" ON "commission_rules"("store_id", "member_id", "payment_trigger");

-- CreateIndex
CREATE INDEX "commission_rule_treatments_rule_id_idx" ON "commission_rule_treatments"("rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_rule_treatments_rule_id_treatment_id_key" ON "commission_rule_treatments"("rule_id", "treatment_id");

-- CreateIndex
CREATE INDEX "commission_accruals_store_id_member_id_status_idx" ON "commission_accruals"("store_id", "member_id", "status");

-- CreateIndex
CREATE INDEX "commission_accruals_store_id_status_accrued_at_idx" ON "commission_accruals"("store_id", "status", "accrued_at");

-- CreateIndex
CREATE INDEX "commission_accruals_store_id_source_financial_entry_id_idx" ON "commission_accruals"("store_id", "source_financial_entry_id");

-- CreateIndex
CREATE INDEX "commission_accruals_store_id_source_budget_id_idx" ON "commission_accruals"("store_id", "source_budget_id");

-- CreateIndex
CREATE INDEX "commission_accruals_store_id_source_patient_treatment_id_idx" ON "commission_accruals"("store_id", "source_patient_treatment_id");

-- CreateIndex
CREATE INDEX "commission_payments_store_id_payment_date_idx" ON "commission_payments"("store_id", "payment_date");

-- CreateIndex
CREATE INDEX "commission_payments_store_id_member_id_idx" ON "commission_payments"("store_id", "member_id");

-- CreateIndex
CREATE INDEX "commission_payments_store_id_expense_entry_id_idx" ON "commission_payments"("store_id", "expense_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "commission_payment_items_accrual_id_key" ON "commission_payment_items"("accrual_id");

-- CreateIndex
CREATE INDEX "commission_payment_items_payment_id_idx" ON "commission_payment_items"("payment_id");

-- AddForeignKey
ALTER TABLE "commission_rule_treatments" ADD CONSTRAINT "commission_rule_treatments_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "commission_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_accruals" ADD CONSTRAINT "commission_accruals_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "commission_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_accruals" ADD CONSTRAINT "commission_accruals_source_financial_entry_id_fkey" FOREIGN KEY ("source_financial_entry_id") REFERENCES "financial_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payments" ADD CONSTRAINT "commission_payments_expense_entry_id_fkey" FOREIGN KEY ("expense_entry_id") REFERENCES "financial_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payment_items" ADD CONSTRAINT "commission_payment_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "commission_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_payment_items" ADD CONSTRAINT "commission_payment_items_accrual_id_fkey" FOREIGN KEY ("accrual_id") REFERENCES "commission_accruals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
