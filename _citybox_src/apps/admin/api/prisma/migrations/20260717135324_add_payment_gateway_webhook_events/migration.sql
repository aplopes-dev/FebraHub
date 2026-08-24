-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "payment_gateway_webhook_events" (
    "id" TEXT NOT NULL,
    "gateway_event_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'PENDING',
    "processed_at" TIMESTAMPTZ(3),
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_gateway_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_gateway_webhook_events_gateway_event_id_key" ON "payment_gateway_webhook_events"("gateway_event_id");

-- CreateIndex
CREATE INDEX "payment_gateway_webhook_events_gateway_event_id_idx" ON "payment_gateway_webhook_events"("gateway_event_id");

-- CreateIndex
CREATE INDEX "payment_gateway_webhook_events_status_idx" ON "payment_gateway_webhook_events"("status");
