-- Manual apply: always run with search_path = clinica
-- (psql defaults to public — patients/treatment_evolutions live in clinica)
SET search_path TO clinica;

-- CreateEnum
CREATE TYPE "EvolutionSignatureStatus" AS ENUM ('unsigned', 'pending', 'signed');

-- CreateEnum
CREATE TYPE "ElectronicSignatureKind" AS ENUM ('anamnesis', 'contract', 'evolution_batch');

-- CreateEnum
CREATE TYPE "ElectronicSignatureStatus" AS ENUM ('pending', 'signed', 'refused', 'cancelled', 'expired');

-- AlterEnum (idempotente: pending pode ter ficado de tentativa anterior)
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'clinica'
      AND t.typname = 'ContractSignatureStatus'
      AND e.enumlabel = 'pending'
  ) THEN
    ALTER TYPE "ContractSignatureStatus" ADD VALUE 'pending';
  END IF;
END
$do$;

-- CreateTable
CREATE TABLE "electronic_signatures" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "kind" "ElectronicSignatureKind" NOT NULL,
    "target_id" TEXT,
    "target_ids" JSONB,
    "zapsign_document_token" TEXT NOT NULL,
    "status" "ElectronicSignatureStatus" NOT NULL DEFAULT 'pending',
    "original_pdf_object_key" VARCHAR(512) NOT NULL,
    "signed_pdf_object_key" VARCHAR(512),
    "signers" JSONB NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "requested_by_name" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "electronic_signatures_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "treatment_evolutions"
ADD COLUMN "signature_status" "EvolutionSignatureStatus" NOT NULL DEFAULT 'unsigned',
ADD COLUMN "signature_request_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "electronic_signatures_zapsign_document_token_key" ON "electronic_signatures"("zapsign_document_token");

-- CreateIndex
CREATE INDEX "electronic_signatures_store_id_patient_id_idx" ON "electronic_signatures"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "electronic_signatures_store_id_patient_id_kind_status_idx" ON "electronic_signatures"("store_id", "patient_id", "kind", "status");

-- CreateIndex
CREATE INDEX "electronic_signatures_store_id_kind_target_id_idx" ON "electronic_signatures"("store_id", "kind", "target_id");

-- CreateIndex
CREATE INDEX "treatment_evolutions_signature_request_id_idx" ON "treatment_evolutions"("signature_request_id");

-- AddForeignKey
ALTER TABLE "electronic_signatures" ADD CONSTRAINT "electronic_signatures_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_evolutions" ADD CONSTRAINT "treatment_evolutions_signature_request_id_fkey" FOREIGN KEY ("signature_request_id") REFERENCES "electronic_signatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
