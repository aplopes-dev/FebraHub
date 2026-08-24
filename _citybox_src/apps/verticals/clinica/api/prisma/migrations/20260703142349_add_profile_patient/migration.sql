-- CreateEnum
CREATE TYPE "clinica"."PatientStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "clinica"."PatientGender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "clinica"."PatientReferralSource" AS ENUM ('indicacao', 'google', 'instagram', 'facebook', 'outro');

-- CreateEnum
CREATE TYPE "clinica"."PatientCategoryColorId" AS ENUM ('blue', 'green', 'purple', 'orange', 'red', 'pink', 'teal', 'amber', 'indigo', 'lime');

-- CreateTable
CREATE TABLE "clinica"."patient_categories" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color_id" "clinica"."PatientCategoryColorId" NOT NULL,
    "is_protected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica"."patients" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "status" "clinica"."PatientStatus" NOT NULL DEFAULT 'active',
    "name" TEXT NOT NULL,
    "cpf" VARCHAR(11),
    "rg" TEXT NOT NULL DEFAULT '',
    "birth_date" DATE,
    "gender" "clinica"."PatientGender" NOT NULL,
    "photo_object_key" VARCHAR(512),
    "photo_mime_type" VARCHAR(64),
    "phone" TEXT NOT NULL DEFAULT '',
    "landline_phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "social_network" TEXT NOT NULL DEFAULT '',
    "medical_record_number" TEXT NOT NULL DEFAULT '',
    "referral_source" "clinica"."PatientReferralSource",
    "profession" TEXT NOT NULL DEFAULT '',
    "category_id" TEXT NOT NULL,
    "guardian_name" TEXT NOT NULL DEFAULT '',
    "guardian_birth_date" DATE,
    "guardian_cpf" VARCHAR(11),
    "guardian_phone" TEXT NOT NULL DEFAULT '',
    "guardian_notes" TEXT NOT NULL DEFAULT '',
    "zip_code" TEXT NOT NULL DEFAULT '',
    "street" TEXT NOT NULL DEFAULT '',
    "street_number" TEXT NOT NULL DEFAULT '',
    "complement" TEXT NOT NULL DEFAULT '',
    "neighborhood" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" VARCHAR(2) NOT NULL DEFAULT '',
    "plan_id" TEXT,
    "plan_number" TEXT NOT NULL DEFAULT '',
    "plan_holder_name" TEXT NOT NULL DEFAULT '',
    "plan_holder_cpf" VARCHAR(11),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_categories_store_id_idx" ON "clinica"."patient_categories"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_categories_store_id_name_key" ON "clinica"."patient_categories"("store_id", "name");

-- CreateIndex
CREATE INDEX "patients_store_id_idx" ON "clinica"."patients"("store_id");

-- CreateIndex
CREATE INDEX "patients_store_id_status_idx" ON "clinica"."patients"("store_id", "status");

-- CreateIndex
CREATE INDEX "patients_store_id_category_id_idx" ON "clinica"."patients"("store_id", "category_id");

-- CreateIndex
CREATE INDEX "patients_store_id_name_idx" ON "clinica"."patients"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "patients_store_id_cpf_key" ON "clinica"."patients"("store_id", "cpf");

-- AddForeignKey
ALTER TABLE "clinica"."patients" ADD CONSTRAINT "patients_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "clinica"."patient_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica"."patients" ADD CONSTRAINT "patients_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "clinica"."clinic_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
