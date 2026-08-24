-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'negotiating', 'scheduled_visit', 'closed_won', 'cancelled');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('walk_in', 'website', 'referral', 'social', 'ads');

-- CreateEnum
CREATE TYPE "LeadPurpose" AS ENUM ('buying', 'renting', 'selling');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('house', 'apartment', 'villa', 'land', 'commercial');

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM ('note', 'system', 'status', 'assignment', 'document', 'property');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "lead_source" "LeadSource" NOT NULL,
    "interested_property_type" "PropertyType" NOT NULL,
    "budget_range" TEXT NOT NULL DEFAULT '',
    "preferred_location" TEXT NOT NULL DEFAULT '',
    "purpose" "LeadPurpose" NOT NULL,
    "latest_follow_up" DATE,
    "next_follow_up" DATE,
    "notes" TEXT NOT NULL DEFAULT '',
    "photo_url" TEXT,
    "property_name" TEXT,
    "has_suggestion" BOOLEAN NOT NULL DEFAULT false,
    "agent_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_agents" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_matched_properties" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "property_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_matched_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_documents" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size_label" TEXT NOT NULL,
    "added_at" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "type" "LeadActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "author_name" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_store_id_idx" ON "leads"("store_id");

-- CreateIndex
CREATE INDEX "leads_store_id_status_idx" ON "leads"("store_id", "status");

-- CreateIndex
CREATE INDEX "leads_store_id_agent_id_idx" ON "leads"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "leads_store_id_name_idx" ON "leads"("store_id", "name");

-- CreateIndex
CREATE INDEX "leads_store_id_created_at_idx" ON "leads"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_agents_agent_id_idx" ON "lead_agents"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_agents_lead_id_agent_id_key" ON "lead_agents"("lead_id", "agent_id");

-- CreateIndex
CREATE INDEX "lead_matched_properties_lead_id_idx" ON "lead_matched_properties"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "lead_matched_properties_lead_id_property_id_key" ON "lead_matched_properties"("lead_id", "property_id");

-- CreateIndex
CREATE INDEX "lead_documents_lead_id_idx" ON "lead_documents"("lead_id");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_created_at_idx" ON "lead_activities"("lead_id", "created_at");

-- AddForeignKey
ALTER TABLE "lead_agents" ADD CONSTRAINT "lead_agents_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_matched_properties" ADD CONSTRAINT "lead_matched_properties_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_documents" ADD CONSTRAINT "lead_documents_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
