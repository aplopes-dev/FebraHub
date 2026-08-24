-- CreateEnum
CREATE TYPE "AppointmentConfirmationSource" AS ENUM ('manual', 'whatsapp');

-- CreateEnum
CREATE TYPE "WhatsappConnectionStatus" AS ENUM ('disconnected', 'qr_pending', 'connected', 'error');

-- CreateEnum
CREATE TYPE "WhatsappTemplateKey" AS ENUM ('appointment_confirmation', 'mgm', 'debit_overdue', 'treatment_return', 'birthday', 'nps');

-- CreateEnum
CREATE TYPE "WhatsappMessageDirection" AS ENUM ('outbound', 'inbound');

-- CreateEnum
CREATE TYPE "WhatsappMessageStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'received');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "confirmation_source" "AppointmentConfirmationSource";

-- CreateTable
CREATE TABLE "whatsapp_connections" (
    "store_id" TEXT NOT NULL,
    "status" "WhatsappConnectionStatus" NOT NULL DEFAULT 'disconnected',
    "phone_e164" VARCHAR(20),
    "last_error" TEXT,
    "auth_state_key" VARCHAR(512) NOT NULL DEFAULT '',
    "qr_base64" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "key" "WhatsappTemplateKey" NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "direction" "WhatsappMessageDirection" NOT NULL,
    "body" TEXT NOT NULL,
    "to_e164" VARCHAR(20) NOT NULL,
    "status" "WhatsappMessageStatus" NOT NULL DEFAULT 'queued',
    "template_key" "WhatsappTemplateKey",
    "provider_message_id" VARCHAR(128),
    "correlation_id" TEXT,
    "expires_at" TIMESTAMPTZ(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_templates_store_id_idx" ON "whatsapp_templates"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_templates_store_id_key_key" ON "whatsapp_templates"("store_id", "key");

-- CreateIndex
CREATE INDEX "whatsapp_messages_store_id_patient_id_created_at_idx" ON "whatsapp_messages"("store_id", "patient_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "whatsapp_messages_store_id_status_created_at_idx" ON "whatsapp_messages"("store_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "whatsapp_messages_store_id_correlation_id_idx" ON "whatsapp_messages"("store_id", "correlation_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_store_id_to_e164_created_at_idx" ON "whatsapp_messages"("store_id", "to_e164", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
