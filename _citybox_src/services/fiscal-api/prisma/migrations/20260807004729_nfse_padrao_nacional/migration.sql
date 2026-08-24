-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FiscalEventType" ADD VALUE 'CANCEL_BY_SUBSTITUTION';
ALTER TYPE "FiscalEventType" ADD VALUE 'FISCAL_ANALYSIS_REQUEST';
ALTER TYPE "FiscalEventType" ADD VALUE 'FISCAL_ANALYSIS_GRANTED';
ALTER TYPE "FiscalEventType" ADD VALUE 'FISCAL_ANALYSIS_DENIED';
ALTER TYPE "FiscalEventType" ADD VALUE 'OFFICIAL_CANCEL';
ALTER TYPE "FiscalEventType" ADD VALUE 'OFFICIAL_BLOCK';
ALTER TYPE "FiscalEventType" ADD VALUE 'OFFICIAL_UNBLOCK';

-- AlterEnum
ALTER TYPE "ProviderType" ADD VALUE 'SEFIN_NACIONAL';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "national_nfse_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "fiscal_documents" ADD COLUMN     "dps_object_key" TEXT,
ADD COLUMN     "municipal_incidence_code" TEXT;

-- AlterTable
ALTER TABLE "fiscal_events" ADD COLUMN     "generator_environment" INTEGER,
ADD COLUMN     "national_event_code" TEXT,
ADD COLUMN     "replaced_by_document_id" UUID;

-- CreateTable
CREATE TABLE "municipal_parameters" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "city_code_ibge" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipal_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipal_parameters_city_code_ibge_key" ON "municipal_parameters"("city_code_ibge");

-- CreateIndex
CREATE INDEX "fiscal_events_replaced_by_document_id_idx" ON "fiscal_events"("replaced_by_document_id");

-- AddForeignKey
ALTER TABLE "fiscal_events" ADD CONSTRAINT "fiscal_events_replaced_by_document_id_fkey" FOREIGN KEY ("replaced_by_document_id") REFERENCES "fiscal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
