-- CreateEnum
CREATE TYPE "AgentLegalDocKind" AS ENUM ('license', 'employment', 'insurance');

-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL DEFAULT '',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "auto_assign_leads" BOOLEAN NOT NULL DEFAULT false,
    "require_two_factor_for_new_users" BOOLEAN NOT NULL DEFAULT true,
    "accent_color_id" TEXT NOT NULL DEFAULT 'orange',
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "leads_alerts" BOOLEAN NOT NULL DEFAULT true,
    "calendar_alerts" BOOLEAN NOT NULL DEFAULT true,
    "documents_alerts" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_profiles" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "role" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "state_id" TEXT NOT NULL DEFAULT '',
    "tax_id" TEXT NOT NULL DEFAULT '',
    "photo_object_key" TEXT,
    "photo_mime_type" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_legal_documents" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "kind" "AgentLegalDocKind" NOT NULL,
    "name" TEXT NOT NULL,
    "size_label" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_settings_store_id_key" ON "store_settings"("store_id");

-- CreateIndex
CREATE INDEX "agent_profiles_store_id_idx" ON "agent_profiles"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_profiles_store_id_agent_id_key" ON "agent_profiles"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "agent_legal_documents_profile_id_idx" ON "agent_legal_documents"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_legal_documents_profile_id_kind_key" ON "agent_legal_documents"("profile_id", "kind");

-- AddForeignKey
ALTER TABLE "agent_legal_documents" ADD CONSTRAINT "agent_legal_documents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
