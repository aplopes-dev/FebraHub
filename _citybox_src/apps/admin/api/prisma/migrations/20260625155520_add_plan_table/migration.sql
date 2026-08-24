-- CreateEnum
CREATE TYPE "platform"."PlanStatus" AS ENUM ('ACTIVE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "platform"."BillingCycle" AS ENUM ('MONTHLY', 'SEMI_ANNUALLY', 'ANNUALLY');

-- CreateTable
CREATE TABLE "platform"."plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "billing_cycle" "platform"."BillingCycle" NOT NULL,
    "max_stores" INTEGER NOT NULL,
    "max_users" INTEGER NOT NULL,
    "max_products" INTEGER,
    "status" "platform"."PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "platform"."plans"("code");
