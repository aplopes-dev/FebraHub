-- Keep lead_documents.object_key / mime_type (upload). Drop generator tables only.

ALTER TABLE "imoveis"."lead_documents" DROP CONSTRAINT "lead_documents_generated_document_id_fkey";

DROP INDEX "imoveis"."lead_documents_generated_document_id_key";

ALTER TABLE "imoveis"."lead_documents" DROP COLUMN "generated_document_id";

DROP TABLE "imoveis"."generated_documents";

DROP TABLE "imoveis"."document_templates";

DROP TYPE "imoveis"."GeneratedDocumentStatus";

DROP TYPE "imoveis"."DocumentTemplateType";
