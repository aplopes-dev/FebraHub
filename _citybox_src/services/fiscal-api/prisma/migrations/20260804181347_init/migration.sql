-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('NFE', 'NFSE');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('SEFAZ_BA_NFE', 'ILHEUS_METROPOLIS_NFSE');

-- CreateEnum
CREATE TYPE "Environment" AS ENUM ('HOMOLOGATION', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "FiscalDocumentStatus" AS ENUM ('DRAFT', 'VALIDATING', 'NUMBER_RESERVED', 'XML_GENERATED', 'SIGNED', 'SENT', 'PROCESSING', 'AUTHORIZED', 'REJECTED', 'DENIED', 'CANCEL_REQUESTED', 'CANCEL_AUTHORIZED', 'CANCEL_REJECTED', 'CORRECTION_LETTER_AUTHORIZED', 'INUTILIZED', 'ERROR', 'SYNC_REQUIRED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('PENDING_VALIDATION', 'VALID', 'EXPIRED', 'INVALID', 'REVOKED');

-- CreateEnum
CREATE TYPE "FiscalEventType" AS ENUM ('ISSUE', 'CANCEL', 'CORRECTION_LETTER', 'INUTILIZATION', 'SYNC');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "store_id" UUID NOT NULL,
    "cnpj" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "state_registration" TEXT,
    "municipal_registration" TEXT,
    "tax_regime" TEXT NOT NULL,
    "city_code_ibge" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "default_environment" "Environment" NOT NULL DEFAULT 'HOMOLOGATION',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "company_id" UUID NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'A1',
    "name" TEXT,
    "encrypted_pfx_object_key" TEXT NOT NULL,
    "encrypted_password" TEXT NOT NULL,
    "subject_cnpj" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "company_id" UUID NOT NULL,
    "document_type" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "state_registration" TEXT,
    "municipal_registration" TEXT,
    "address" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_documents" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "company_id" UUID NOT NULL,
    "customer_id" UUID,
    "document_type" "DocumentType" NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "environment" "Environment" NOT NULL,
    "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "source_system" TEXT NOT NULL,
    "external_reference" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "series" TEXT,
    "number" TEXT,
    "rps_series" TEXT,
    "rps_number" TEXT,
    "access_key" TEXT,
    "verification_code" TEXT,
    "protocol" TEXT,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "xml_object_key" TEXT,
    "error_code" TEXT,
    "error_message" TEXT,
    "issued_at" TIMESTAMP(3),
    "authorized_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_document_items" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "fiscal_document_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit_value" DECIMAL(15,4) NOT NULL,
    "total_value" DECIMAL(15,2) NOT NULL,
    "item_type" TEXT NOT NULL,
    "ncm" TEXT,
    "cfop" TEXT,
    "cst" TEXT,
    "csosn" TEXT,
    "service_code" TEXT,
    "tax_json" JSONB,

    CONSTRAINT "fiscal_document_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_events" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "fiscal_document_id" UUID NOT NULL,
    "event_type" "FiscalEventType" NOT NULL,
    "sequence" INTEGER,
    "status" TEXT NOT NULL,
    "justification" TEXT,
    "correction_text" TEXT,
    "protocol" TEXT,
    "request_xml_object_key" TEXT,
    "response_xml_object_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_sequences" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "company_id" UUID NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "series" TEXT NOT NULL,
    "current_number" BIGINT NOT NULL DEFAULT 0,
    "environment" "Environment" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fiscal_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_requests" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "fiscal_document_id" UUID,
    "provider" "ProviderType" NOT NULL,
    "operation" TEXT NOT NULL,
    "request_xml_object_key" TEXT,
    "response_xml_object_key" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_store_id_key" ON "companies"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_key" ON "companies"("cnpj");

-- CreateIndex
CREATE INDEX "certificates_company_id_idx" ON "certificates"("company_id");

-- CreateIndex
CREATE INDEX "customers_company_id_idx" ON "customers"("company_id");

-- CreateIndex
CREATE INDEX "fiscal_documents_company_id_document_type_status_idx" ON "fiscal_documents"("company_id", "document_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_documents_source_system_external_reference_document__key" ON "fiscal_documents"("source_system", "external_reference", "document_type", "idempotency_key");

-- CreateIndex
CREATE INDEX "fiscal_document_items_fiscal_document_id_idx" ON "fiscal_document_items"("fiscal_document_id");

-- CreateIndex
CREATE INDEX "fiscal_events_fiscal_document_id_created_at_idx" ON "fiscal_events"("fiscal_document_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_sequences_company_id_document_type_series_environmen_key" ON "fiscal_sequences"("company_id", "document_type", "series", "environment");

-- CreateIndex
CREATE INDEX "provider_requests_fiscal_document_id_idx" ON "provider_requests"("fiscal_document_id");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_documents" ADD CONSTRAINT "fiscal_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_document_items" ADD CONSTRAINT "fiscal_document_items_fiscal_document_id_fkey" FOREIGN KEY ("fiscal_document_id") REFERENCES "fiscal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_events" ADD CONSTRAINT "fiscal_events_fiscal_document_id_fkey" FOREIGN KEY ("fiscal_document_id") REFERENCES "fiscal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_sequences" ADD CONSTRAINT "fiscal_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_requests" ADD CONSTRAINT "provider_requests_fiscal_document_id_fkey" FOREIGN KEY ("fiscal_document_id") REFERENCES "fiscal_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
