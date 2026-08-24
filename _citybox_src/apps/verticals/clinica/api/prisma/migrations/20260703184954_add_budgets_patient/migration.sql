-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "BudgetDiscountType" AS ENUM ('fixed', 'percent');

-- CreateEnum
CREATE TYPE "BudgetItemLocationType" AS ENUM ('tooth', 'body_region', 'session', 'none');

-- CreateEnum
CREATE TYPE "PatientTreatmentSource" AS ENUM ('budget', 'standalone');

-- CreateEnum
CREATE TYPE "PatientTreatmentStatus" AS ENUM ('active', 'completed');

-- CreateEnum
CREATE TYPE "TreatmentEvolutionSource" AS ENUM ('treatment', 'standalone');

-- CreateEnum
CREATE TYPE "EvolutionHistoryAction" AS ENUM ('created', 'edited', 'confirmed');

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATE NOT NULL,
    "observations" TEXT NOT NULL DEFAULT '',
    "responsible_id" TEXT NOT NULL,
    "responsible_name" TEXT NOT NULL DEFAULT '',
    "discount_type" "BudgetDiscountType",
    "discount_value" INTEGER,
    "subtotal_cents" INTEGER NOT NULL,
    "final_value_cents" INTEGER NOT NULL,
    "installment_enabled" BOOLEAN NOT NULL DEFAULT false,
    "down_payment_cents" INTEGER NOT NULL DEFAULT 0,
    "installments_count" INTEGER NOT NULL DEFAULT 0,
    "status" "BudgetStatus" NOT NULL DEFAULT 'pending',
    "supersedes_budget_id" TEXT,
    "approved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "budget_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT NOT NULL DEFAULT '',
    "plan_name" TEXT NOT NULL DEFAULT '',
    "treatment_name" TEXT NOT NULL DEFAULT '',
    "value_cents" INTEGER NOT NULL,
    "location_type" "BudgetItemLocationType" NOT NULL DEFAULT 'none',
    "location_label" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_treatments" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "source" "PatientTreatmentSource" NOT NULL,
    "status" "PatientTreatmentStatus" NOT NULL DEFAULT 'active',
    "budget_id" TEXT,
    "budget_item_id" TEXT,
    "plan_id" TEXT,
    "treatment_id" TEXT,
    "professional_id" TEXT,
    "professional_name" TEXT NOT NULL DEFAULT '',
    "plan_name" TEXT NOT NULL DEFAULT '',
    "treatment_name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "value_cents" INTEGER NOT NULL,
    "location_type" "BudgetItemLocationType" NOT NULL DEFAULT 'none',
    "location_label" TEXT NOT NULL DEFAULT '',
    "diagnosis" TEXT NOT NULL DEFAULT '',
    "observation" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL,
    "finalized_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_evolutions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "treatment_id" TEXT,
    "source" "TreatmentEvolutionSource" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "value_cents" INTEGER,
    "evolution_notes" TEXT NOT NULL DEFAULT '',
    "professional_id" TEXT,
    "professional_name" TEXT NOT NULL DEFAULT '',
    "finalized_at" TIMESTAMPTZ(3) NOT NULL,
    "soap_subjective" TEXT,
    "soap_objective" TEXT,
    "soap_assessment" TEXT,
    "soap_plan" TEXT,
    "cid10_codes" JSONB,
    "confirmed_at" TIMESTAMPTZ(3),
    "confirmed_by" TEXT,
    "confirmation_hash" VARCHAR(128),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "treatment_evolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evolution_history" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "evolution_id" TEXT NOT NULL,
    "action" "EvolutionHistoryAction" NOT NULL,
    "professional_id" TEXT,
    "professional_name" TEXT NOT NULL DEFAULT '',
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evolution_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_evolution_images" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "evolution_id" TEXT NOT NULL,
    "object_key" VARCHAR(512) NOT NULL,
    "mime_type" VARCHAR(64) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_evolution_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budgets_store_id_idx" ON "budgets"("store_id");

-- CreateIndex
CREATE INDEX "budgets_store_id_patient_id_idx" ON "budgets"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "budgets_store_id_patient_id_status_idx" ON "budgets"("store_id", "patient_id", "status");

-- CreateIndex
CREATE INDEX "budget_items_budget_id_idx" ON "budget_items"("budget_id");

-- CreateIndex
CREATE INDEX "budget_items_store_id_idx" ON "budget_items"("store_id");

-- CreateIndex
CREATE INDEX "patient_treatments_store_id_idx" ON "patient_treatments"("store_id");

-- CreateIndex
CREATE INDEX "patient_treatments_store_id_patient_id_idx" ON "patient_treatments"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_treatments_store_id_patient_id_status_idx" ON "patient_treatments"("store_id", "patient_id", "status");

-- CreateIndex
CREATE INDEX "treatment_evolutions_store_id_idx" ON "treatment_evolutions"("store_id");

-- CreateIndex
CREATE INDEX "treatment_evolutions_store_id_patient_id_idx" ON "treatment_evolutions"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "treatment_evolutions_treatment_id_idx" ON "treatment_evolutions"("treatment_id");

-- CreateIndex
CREATE INDEX "evolution_history_evolution_id_idx" ON "evolution_history"("evolution_id");

-- CreateIndex
CREATE INDEX "evolution_history_store_id_idx" ON "evolution_history"("store_id");

-- CreateIndex
CREATE INDEX "treatment_evolution_images_evolution_id_idx" ON "treatment_evolution_images"("evolution_id");

-- CreateIndex
CREATE INDEX "treatment_evolution_images_store_id_idx" ON "treatment_evolution_images"("store_id");

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_supersedes_budget_id_fkey" FOREIGN KEY ("supersedes_budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "clinic_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "clinic_plan_treatments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_treatments" ADD CONSTRAINT "patient_treatments_budget_item_id_fkey" FOREIGN KEY ("budget_item_id") REFERENCES "budget_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_evolutions" ADD CONSTRAINT "treatment_evolutions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_evolutions" ADD CONSTRAINT "treatment_evolutions_treatment_id_fkey" FOREIGN KEY ("treatment_id") REFERENCES "patient_treatments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evolution_history" ADD CONSTRAINT "evolution_history_evolution_id_fkey" FOREIGN KEY ("evolution_id") REFERENCES "treatment_evolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_evolution_images" ADD CONSTRAINT "treatment_evolution_images_evolution_id_fkey" FOREIGN KEY ("evolution_id") REFERENCES "treatment_evolutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
