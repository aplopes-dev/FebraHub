-- CreateEnum
CREATE TYPE "PatientContractIssuedVia" AS ENUM ('manual');

-- CreateEnum
CREATE TYPE "ContractSignatureStatus" AS ENUM ('unsigned', 'signed');

-- CreateEnum
CREATE TYPE "PatientCertificateType" AS ENUM ('days', 'attendance');

-- CreateTable
CREATE TABLE "patient_contract_emissions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL,
    "issued_via" "PatientContractIssuedVia" NOT NULL DEFAULT 'manual',
    "responsible_name" TEXT NOT NULL DEFAULT '',
    "patient_name" TEXT NOT NULL,
    "responsible_signature_status" "ContractSignatureStatus" NOT NULL DEFAULT 'unsigned',
    "patient_signature_status" "ContractSignatureStatus" NOT NULL DEFAULT 'unsigned',
    "form_values" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_contract_emissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_prescriptions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "clinic_name" TEXT,
    "issued_date" DATE NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL,
    "items" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_certificates" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "professional_name" TEXT NOT NULL,
    "patient_name" TEXT NOT NULL,
    "clinic_name" TEXT,
    "type" "PatientCertificateType" NOT NULL,
    "issued_date" DATE NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL,
    "days_count" TEXT,
    "start_time" VARCHAR(5),
    "end_time" VARCHAR(5),
    "cid" VARCHAR(16),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_contract_emissions_store_id_patient_id_idx" ON "patient_contract_emissions"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_prescriptions_store_id_patient_id_idx" ON "patient_prescriptions"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_certificates_store_id_patient_id_idx" ON "patient_certificates"("store_id", "patient_id");

-- AddForeignKey
ALTER TABLE "patient_contract_emissions" ADD CONSTRAINT "patient_contract_emissions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_contract_emissions" ADD CONSTRAINT "patient_contract_emissions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contract_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_prescriptions" ADD CONSTRAINT "patient_prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_certificates" ADD CONSTRAINT "patient_certificates_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
