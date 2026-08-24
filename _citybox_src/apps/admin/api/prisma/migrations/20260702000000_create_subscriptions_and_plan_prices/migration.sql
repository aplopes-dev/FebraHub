-- This migration consolidates the 3 subscription-related migrations into one.
-- It assumes the database state after migration 20260626123203 (add_plan_id_to_client):
--   clients: has plan_id FK → plans
--   plans: has price_cents, billing_cycle columns
--   BillingCycle enum exists

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- Clean up plans table: remove columns that are now in plan_prices / subscriptions
ALTER TABLE "plans" DROP COLUMN "price_cents";
ALTER TABLE "plans" DROP COLUMN "billing_cycle";

-- Clean up clients table: billing data moved to subscriptions
ALTER TABLE "clients" DROP CONSTRAINT "clients_plan_id_fkey";
ALTER TABLE "clients" DROP COLUMN "plan_id";
ALTER TABLE "clients" DROP COLUMN "billing_cycle";
ALTER TABLE "clients" DROP COLUMN "due_day";

-- Drop obsolete enum
DROP TYPE "BillingCycle";

-- CreateTable: plan_prices (prices per cycle for each plan)
CREATE TABLE "plan_prices" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "stripe_price_id" TEXT,
    "cycle" "SubscriptionCycle" NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: subscriptions
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "plan_price_id" TEXT NOT NULL,
    "cycle" "SubscriptionCycle" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_period_start" TIMESTAMPTZ(3) NOT NULL,
    "current_period_end" TIMESTAMPTZ(3) NOT NULL,
    "day_of_month" INTEGER NOT NULL,
    "stripe_subscription_id" TEXT,
    "canceled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_stripe_price_id_key" ON "plan_prices"("stripe_price_id");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_plan_id_cycle_key" ON "plan_prices"("plan_id", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "subscriptions_client_id_idx" ON "subscriptions"("client_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_price_id_idx" ON "subscriptions"("plan_price_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

CREATE UNIQUE INDEX "subscriptions_client_id_active_unique_idx" 
ON "subscriptions"("client_id") 
WHERE "status" IN ('ACTIVE', 'TRIALING');

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_price_id_fkey" FOREIGN KEY ("plan_price_id") REFERENCES "plan_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
