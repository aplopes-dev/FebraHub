-- CreateEnum
CREATE TYPE "TeamMemberRole" AS ENUM ('admin', 'broker', 'assistant');

-- CreateEnum
CREATE TYPE "AgentDocumentFolder" AS ENUM ('client', 'property', 'legal', 'signed');

-- CreateEnum
CREATE TYPE "AgentDocumentStatus" AS ENUM ('pending', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "AgentDocumentSource" AS ENUM ('manual', 'profile_legal');

-- AlterTable
ALTER TABLE "agent_profiles" ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "store_settings" ADD COLUMN     "billing_amount_cents" INTEGER NOT NULL DEFAULT 19900,
ADD COLUMN     "billing_plan_name" TEXT NOT NULL DEFAULT 'Profissional',
ADD COLUMN     "billing_renews_at" TIMESTAMPTZ(3),
ADD COLUMN     "billing_status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "integrations_json" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "agent_device_sessions" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "last_active_label" TEXT NOT NULL DEFAULT '',
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "role" "TeamMemberRole" NOT NULL DEFAULT 'broker',
    "initials" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "permissions_json" JSONB NOT NULL DEFAULT '{}',
    "last_access_at" TIMESTAMPTZ(3),
    "password_hash" TEXT,
    "temporary_password" TEXT,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_folder_documents" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "folder_id" "AgentDocumentFolder" NOT NULL,
    "name" TEXT NOT NULL,
    "status" "AgentDocumentStatus" NOT NULL DEFAULT 'pending',
    "size_label" TEXT NOT NULL DEFAULT '',
    "details_label" TEXT NOT NULL DEFAULT '',
    "object_key" TEXT,
    "mime_type" TEXT,
    "source" "AgentDocumentSource" NOT NULL DEFAULT 'manual',
    "legal_kind" "AgentLegalDocKind",
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "agent_folder_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_device_sessions_store_id_agent_id_idx" ON "agent_device_sessions"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "team_members_store_id_idx" ON "team_members"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_store_id_agent_id_key" ON "team_members"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "agent_folder_documents_store_id_agent_id_folder_id_idx" ON "agent_folder_documents"("store_id", "agent_id", "folder_id");
