-- AlterTable
ALTER TABLE "property_documents" ADD COLUMN "object_key" TEXT;
ALTER TABLE "property_documents" ADD COLUMN "mime_type" TEXT NOT NULL DEFAULT 'application/pdf';
