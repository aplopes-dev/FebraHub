-- CreateEnum
CREATE TYPE "CampaignSegment" AS ENUM ('captacao_leads', 'operacional_atendimento', 'relacionamento_pos_venda');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('form_lead', 'mgm', 'debito_atraso', 'retorno_tratamento', 'aniversario', 'nps');

-- CreateEnum
CREATE TYPE "CampaignStrategy" AS ENUM ('PAGE', 'BROADCAST', 'AUTOMATION');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('draft', 'active', 'inactive', 'paused', 'finished');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('web', 'whatsapp', 'sms');

-- CreateEnum
CREATE TYPE "CampaignStatusType" AS ENUM ('always_active', 'period', 'limit');

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "segment" "CampaignSegment" NOT NULL,
    "type" "CampaignType" NOT NULL,
    "strategy" "CampaignStrategy" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'active',
    "channel" "CampaignChannel" NOT NULL,
    "status_type" "CampaignStatusType" NOT NULL DEFAULT 'always_active',
    "start_date" TIMESTAMPTZ(3),
    "end_date" TIMESTAMPTZ(3),
    "lead_limit" INTEGER,
    "views" INTEGER NOT NULL DEFAULT 0,
    "submissions" INTEGER NOT NULL DEFAULT 0,
    "funnel_id" TEXT,
    "stage_id" TEXT,
    "content" JSONB NOT NULL,
    "public_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_submissions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "campaign_type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'web',
    "payload" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "phone_key" TEXT,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "campaign_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaigns_store_id_status_idx" ON "campaigns"("store_id", "status");

-- CreateIndex
CREATE INDEX "campaigns_store_id_segment_idx" ON "campaigns"("store_id", "segment");

-- CreateIndex
CREATE INDEX "campaigns_store_id_type_idx" ON "campaigns"("store_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_store_id_slug_key" ON "campaigns"("store_id", "slug");

-- CreateIndex
CREATE INDEX "campaign_submissions_store_id_campaign_id_submitted_at_idx" ON "campaign_submissions"("store_id", "campaign_id", "submitted_at" DESC);

-- CreateIndex
CREATE INDEX "campaign_submissions_campaign_id_phone_key_idx" ON "campaign_submissions"("campaign_id", "phone_key");

-- AddForeignKey
ALTER TABLE "campaign_submissions" ADD CONSTRAINT "campaign_submissions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
