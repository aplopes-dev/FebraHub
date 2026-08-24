-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('scheduled', 'confirmed', 'patient_waiting', 'in_progress', 'finished', 'missed', 'cancelled_patient', 'cancelled_pro');

-- CreateEnum
CREATE TYPE "AppointmentChannel" AS ENUM ('phone', 'whatsapp', 'in_person', 'online', 'other');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('private', 'plan');

-- CreateEnum
CREATE TYPE "ReturnOption" AS ENUM ('none', 'one_month', 'six_months', 'twelve_months', 'custom_date');

-- CreateEnum
CREATE TYPE "InternalEventAvailability" AS ENUM ('busy', 'available');

-- CreateEnum
CREATE TYPE "InternalEventPrivacy" AS ENUM ('private', 'public');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'yearly');

-- CreateEnum
CREATE TYPE "RecurrenceEnd" AS ENUM ('never', 'on_date');

-- CreateEnum
CREATE TYPE "FitInShift" AS ENUM ('morning', 'afternoon', 'any');

-- CreateEnum
CREATE TYPE "FitInStatus" AS ENUM ('pending', 'scheduled', 'cancelled');

-- CreateEnum
CREATE TYPE "ReturnAlertSource" AS ENUM ('auto', 'manual');

-- CreateTable
CREATE TABLE "appointment_categories" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "appointment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "procedure_id" TEXT,
    "room_id" TEXT,
    "category_id" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'scheduled',
    "channel" "AppointmentChannel",
    "insurance_type" "InsuranceType" NOT NULL DEFAULT 'private',
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "notes" TEXT,
    "return_option" "ReturnOption",
    "return_date" DATE,
    "return_reason" TEXT,
    "fit_in_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_events" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "room_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_type" "RecurrenceType",
    "recurrence_end" "RecurrenceEnd",
    "recurrence_end_date" DATE,
    "availability" "InternalEventAvailability" NOT NULL DEFAULT 'busy',
    "privacy" "InternalEventPrivacy" NOT NULL DEFAULT 'public',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "internal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fit_ins" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "professional_id" TEXT,
    "category_id" TEXT,
    "fit_in_date" DATE,
    "any_date" BOOLEAN NOT NULL DEFAULT false,
    "shifts" "FitInShift"[],
    "plan_name" TEXT,
    "observation" TEXT,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "status" "FitInStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "fit_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_alerts" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "due_date" DATE NOT NULL,
    "reason" TEXT,
    "source" "ReturnAlertSource" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "return_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointment_categories_store_id_idx" ON "appointment_categories"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_categories_store_id_name_key" ON "appointment_categories"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_fit_in_id_key" ON "appointments"("fit_in_id");

-- CreateIndex
CREATE INDEX "appointments_store_id_idx" ON "appointments"("store_id");

-- CreateIndex
CREATE INDEX "appointments_store_id_professional_id_start_at_idx" ON "appointments"("store_id", "professional_id", "start_at");

-- CreateIndex
CREATE INDEX "appointments_store_id_patient_id_idx" ON "appointments"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "appointments_store_id_start_at_end_at_idx" ON "appointments"("store_id", "start_at", "end_at");

-- CreateIndex
CREATE INDEX "internal_events_store_id_idx" ON "internal_events"("store_id");

-- CreateIndex
CREATE INDEX "internal_events_store_id_professional_id_idx" ON "internal_events"("store_id", "professional_id");

-- CreateIndex
CREATE INDEX "fit_ins_store_id_idx" ON "fit_ins"("store_id");

-- CreateIndex
CREATE INDEX "fit_ins_store_id_patient_id_status_idx" ON "fit_ins"("store_id", "patient_id", "status");

-- CreateIndex
CREATE INDEX "return_alerts_store_id_idx" ON "return_alerts"("store_id");

-- CreateIndex
CREATE INDEX "return_alerts_store_id_patient_id_idx" ON "return_alerts"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "return_alerts_store_id_due_date_idx" ON "return_alerts"("store_id", "due_date");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "clinic_plan_treatments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "appointment_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_fit_in_id_fkey" FOREIGN KEY ("fit_in_id") REFERENCES "fit_ins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fit_ins" ADD CONSTRAINT "fit_ins_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fit_ins" ADD CONSTRAINT "fit_ins_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "appointment_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_alerts" ADD CONSTRAINT "return_alerts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_alerts" ADD CONSTRAINT "return_alerts_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
