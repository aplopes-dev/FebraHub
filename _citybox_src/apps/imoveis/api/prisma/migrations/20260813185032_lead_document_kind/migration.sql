-- CreateEnum
CREATE TYPE "imoveis"."LeadDocumentKind" AS ENUM ('contract', 'other');

-- AlterTable
ALTER TABLE "imoveis"."lead_documents"
ADD COLUMN "kind" "imoveis"."LeadDocumentKind" NOT NULL DEFAULT 'other';
