-- CreateEnum
CREATE TYPE "ClinicPlanStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "ClinicPlanTreatmentInit" AS ENUM ('copy_default', 'empty');

-- CreateTable
CREATE TABLE "clinic_plans" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "status" "ClinicPlanStatus" NOT NULL DEFAULT 'active',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "treatment_init" "ClinicPlanTreatmentInit",
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_plan_specialties" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_plan_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_plan_treatments" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "specialty_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value_cents" INTEGER NOT NULL,
    "cost_cents" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_plan_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinic_plans_store_id_idx" ON "clinic_plans"("store_id");

-- CreateIndex
CREATE INDEX "clinic_plan_specialties_store_id_idx" ON "clinic_plan_specialties"("store_id");

-- CreateIndex
CREATE INDEX "clinic_plan_specialties_plan_id_idx" ON "clinic_plan_specialties"("plan_id");

-- CreateIndex
CREATE INDEX "clinic_plan_treatments_store_id_idx" ON "clinic_plan_treatments"("store_id");

-- CreateIndex
CREATE INDEX "clinic_plan_treatments_plan_id_idx" ON "clinic_plan_treatments"("plan_id");

-- CreateIndex
CREATE INDEX "clinic_plan_treatments_specialty_id_idx" ON "clinic_plan_treatments"("specialty_id");

-- AddForeignKey
ALTER TABLE "clinic_plan_specialties" ADD CONSTRAINT "clinic_plan_specialties_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "clinic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_plan_treatments" ADD CONSTRAINT "clinic_plan_treatments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "clinic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_plan_treatments" ADD CONSTRAINT "clinic_plan_treatments_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "clinic_plan_specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Partial unique: at most one default plan per store
CREATE UNIQUE INDEX "clinic_plans_one_default_per_store"
  ON "clinic_plans" ("store_id")
  WHERE "is_default" = true;
