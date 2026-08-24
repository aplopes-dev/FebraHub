-- CreateEnum
CREATE TYPE "imoveis"."LeadDocumentSentChannel" AS ENUM ('whatsapp', 'share', 'link');

-- AlterTable
ALTER TABLE "imoveis"."lead_documents"
ADD COLUMN "sent_at" TIMESTAMP(3),
ADD COLUMN "sent_channel" "imoveis"."LeadDocumentSentChannel",
ADD COLUMN "share_token" TEXT,
ADD COLUMN "share_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "lead_documents_share_token_key" ON "imoveis"."lead_documents"("share_token");
