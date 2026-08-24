-- AlterTable
ALTER TABLE "imoveis"."leads"
ADD COLUMN "document_upload_token" TEXT,
ADD COLUMN "document_upload_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "leads_document_upload_token_key" ON "imoveis"."leads"("document_upload_token");
