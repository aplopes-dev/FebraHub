-- CreateEnum
CREATE TYPE "imoveis"."DocumentTemplateType" AS ENUM (
  'termo_visita',
  'recibo_sinal',
  'proposta_compra',
  'proposta_locacao',
  'contrato_promessa_compra_venda',
  'contrato_locacao',
  'outro'
);

-- CreateEnum
CREATE TYPE "imoveis"."GeneratedDocumentStatus" AS ENUM ('rascunho', 'gerado');

-- AlterTable
ALTER TABLE "imoveis"."lead_documents"
ADD COLUMN "object_key" TEXT,
ADD COLUMN "mime_type" TEXT,
ADD COLUMN "generated_document_id" TEXT;

-- CreateTable
CREATE TABLE "imoveis"."document_templates" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "imoveis"."DocumentTemplateType" NOT NULL,
    "conteudo_html" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imoveis"."generated_documents" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo_render" TEXT NOT NULL,
    "dados_snapshot" JSONB NOT NULL,
    "object_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "status" "imoveis"."GeneratedDocumentStatus" NOT NULL DEFAULT 'gerado',
    "lead_id" TEXT,
    "deal_id" TEXT,
    "property_id" TEXT,
    "appointment_id" TEXT,
    "transaction_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_templates_store_id_tipo_idx" ON "imoveis"."document_templates"("store_id", "tipo");
CREATE INDEX "document_templates_store_id_ativo_idx" ON "imoveis"."document_templates"("store_id", "ativo");
CREATE INDEX "generated_documents_store_id_created_at_idx" ON "imoveis"."generated_documents"("store_id", "created_at");
CREATE INDEX "generated_documents_store_id_template_id_idx" ON "imoveis"."generated_documents"("store_id", "template_id");
CREATE INDEX "generated_documents_lead_id_idx" ON "imoveis"."generated_documents"("lead_id");
CREATE INDEX "generated_documents_appointment_id_idx" ON "imoveis"."generated_documents"("appointment_id");
CREATE INDEX "generated_documents_transaction_id_idx" ON "imoveis"."generated_documents"("transaction_id");

CREATE UNIQUE INDEX "lead_documents_generated_document_id_key" ON "imoveis"."lead_documents"("generated_document_id");

ALTER TABLE "imoveis"."generated_documents"
ADD CONSTRAINT "generated_documents_template_id_fkey"
FOREIGN KEY ("template_id") REFERENCES "imoveis"."document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "imoveis"."generated_documents"
ADD CONSTRAINT "generated_documents_lead_id_fkey"
FOREIGN KEY ("lead_id") REFERENCES "imoveis"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "imoveis"."generated_documents"
ADD CONSTRAINT "generated_documents_deal_id_fkey"
FOREIGN KEY ("deal_id") REFERENCES "imoveis"."deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "imoveis"."generated_documents"
ADD CONSTRAINT "generated_documents_property_id_fkey"
FOREIGN KEY ("property_id") REFERENCES "imoveis"."properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "imoveis"."generated_documents"
ADD CONSTRAINT "generated_documents_appointment_id_fkey"
FOREIGN KEY ("appointment_id") REFERENCES "imoveis"."appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "imoveis"."generated_documents"
ADD CONSTRAINT "generated_documents_transaction_id_fkey"
FOREIGN KEY ("transaction_id") REFERENCES "imoveis"."transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "imoveis"."lead_documents"
ADD CONSTRAINT "lead_documents_generated_document_id_fkey"
FOREIGN KEY ("generated_document_id") REFERENCES "imoveis"."generated_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
