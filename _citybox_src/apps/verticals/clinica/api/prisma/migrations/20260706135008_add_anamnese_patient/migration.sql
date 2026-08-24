-- CreateEnum
CREATE TYPE "PatientAnamnesisStatus" AS ENUM ('issued', 'awaiting_response');

-- CreateEnum
CREATE TYPE "PatientAnamnesisSignatureStatus" AS ENUM ('unsigned', 'pending', 'signed');

-- CreateEnum
CREATE TYPE "PatientAnamnesisFillingMode" AS ENUM ('professional', 'patient');

-- CreateTable
CREATE TABLE "patient_anamneses" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "issued_at" DATE NOT NULL,
    "status" "PatientAnamnesisStatus" NOT NULL,
    "signature_status" "PatientAnamnesisSignatureStatus" NOT NULL DEFAULT 'unsigned',
    "filling_mode" "PatientAnamnesisFillingMode" NOT NULL,
    "consultation_reason" TEXT,
    "questions_snapshot" JSONB NOT NULL,
    "answers" JSONB,
    "public_token" TEXT,
    "link_expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_anamneses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_anamneses_public_token_key" ON "patient_anamneses"("public_token");

-- CreateIndex
CREATE INDEX "patient_anamneses_store_id_patient_id_idx" ON "patient_anamneses"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_anamneses_store_id_patient_id_status_idx" ON "patient_anamneses"("store_id", "patient_id", "status");

-- AddForeignKey
ALTER TABLE "patient_anamneses" ADD CONSTRAINT "patient_anamneses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_anamneses" ADD CONSTRAINT "patient_anamneses_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "anamnesis_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
