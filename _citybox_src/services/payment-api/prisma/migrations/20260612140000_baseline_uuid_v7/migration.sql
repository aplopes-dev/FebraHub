-- Baseline citybox_payments: UUID v7 (citybox_uuid_v7) + TIMESTAMPTZ(3).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION citybox_uuid_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms := substring(int8send((extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3 FOR 6);
  uuid_bytes := unix_ts_ms || gen_random_bytes(10);
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "ProviderAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('ASAAS', 'PAGBANK', 'INFINITE_PAY', 'STONE', 'STUB');

-- CreateEnum
CREATE TYPE "EnvironmentType" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('DRAFT', 'CREATED', 'PENDING', 'WAITING_PAYMENT', 'AUTHORIZED', 'PAID', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK', 'DISPUTED', 'FAILED', 'ERROR');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('PENDING', 'PROCESSING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'AUTHORIZED', 'CAPTURED', 'PAID', 'CONFIRMED', 'AVAILABLE', 'SETTLED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "ConsumerWebhookStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProviderWebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');

-- CreateEnum
CREATE TYPE "InternalWebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "ProviderRequestStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "IdempotencyKeyStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReconciliationBatchStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReconciliationItemStatus" AS ENUM ('PENDING', 'MATCHED', 'PARTIALLY_MATCHED', 'DIVERGENT', 'MANUAL_REVIEW', 'RECONCILED');

-- CreateEnum
CREATE TYPE "ReconciliationImportSource" AS ENUM ('BANK_STATEMENT', 'PROVIDER_EXTRACT', 'MANUAL');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'AVAILABLE', 'SETTLED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentEntryType" AS ENUM ('CAPTURE', 'FEE', 'NET', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'OVERDUE', 'TRIAL', 'EXPIRED', 'PENDING');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionCycleStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "SplitStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchants" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "cpf_cnpj" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address_json" JSONB,
    "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_accounts" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "environment" "EnvironmentType" NOT NULL,
    "credentials_encrypted" TEXT NOT NULL,
    "webhook_secret_encrypted" TEXT,
    "status" "ProviderAccountStatus" NOT NULL DEFAULT 'PENDING',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "provider_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_customers" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_customers" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "customer_id" UUID NOT NULL,
    "provider_account_id" UUID NOT NULL,
    "provider_customer_id" TEXT NOT NULL,
    "raw_payload" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "provider_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "provider_account_id" UUID,
    "source_system" TEXT NOT NULL,
    "external_reference" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "description" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "ChargeStatus" NOT NULL DEFAULT 'DRAFT',
    "due_date" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "payment_url" TEXT,
    "provider" "ProviderType",
    "provider_charge_id" TEXT,
    "provider_order_id" TEXT,
    "provider_payment_id" TEXT,
    "raw_provider_payload" JSONB,
    "metadata_json" JSONB,
    "subscription_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charge_items" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "charge_id" UUID NOT NULL,
    "external_item_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "unit_value" DECIMAL(14,2) NOT NULL,
    "total_value" DECIMAL(14,2) NOT NULL,
    "metadata_json" JSONB,

    CONSTRAINT "charge_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "charge_id" UUID NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "payment_method" TEXT NOT NULL,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "authorization_code" TEXT,
    "transaction_id" TEXT,
    "provider_payment_id" TEXT,
    "raw_provider_payload" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "charge_id" UUID NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "payment_method" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "fee_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "paid_at" TIMESTAMPTZ(3),
    "confirmed_at" TIMESTAMPTZ(3),
    "available_at" TIMESTAMPTZ(3),
    "settled_at" TIMESTAMPTZ(3),
    "provider_payment_id" TEXT,
    "raw_provider_payload" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "payment_id" UUID NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT,
    "provider_refund_id" TEXT,
    "requested_by" TEXT,
    "requested_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),
    "raw_provider_payload" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_webhook_events" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "provider" "ProviderType" NOT NULL,
    "provider_account_id" UUID,
    "event_type" TEXT NOT NULL,
    "event_id" TEXT,
    "signature_valid" BOOLEAN NOT NULL DEFAULT false,
    "raw_payload" JSONB NOT NULL,
    "headers_json" JSONB,
    "status" "ProviderWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),
    "error_message" TEXT,

    CONSTRAINT "provider_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_webhook_deliveries" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "target_url" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "signature" TEXT,
    "status" "InternalWebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMPTZ(3),
    "next_retry_at" TIMESTAMPTZ(3),
    "response_status" INTEGER,
    "response_body" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "internal_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_requests" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "operation" TEXT NOT NULL,
    "charge_id" UUID,
    "payment_id" UUID,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "status" "ProviderRequestStatus" NOT NULL,
    "http_status" INTEGER,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" "IdempotencyKeyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "request_hash" TEXT,
    "response_json" JSONB,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID,
    "actor" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "metadata_json" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumer_webhooks" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "source_system" TEXT,
    "url" TEXT NOT NULL,
    "secret_encrypted" TEXT NOT NULL,
    "event_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ConsumerWebhookStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "consumer_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_entries" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "charge_id" UUID NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "entry_type" "PaymentEntryType" NOT NULL,
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "fee_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "provider_reference" TEXT,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "merchant_id" UUID,
    "payment_id" UUID NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "gross_amount" DECIMAL(14,2) NOT NULL,
    "fee_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(14,2) NOT NULL,
    "expected_available_at" TIMESTAMPTZ(3),
    "available_at" TIMESTAMPTZ(3),
    "settled_at" TIMESTAMPTZ(3),
    "provider" "ProviderType" NOT NULL,
    "provider_settlement_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_batches" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "provider" "ProviderType",
    "source" "ReconciliationImportSource" NOT NULL,
    "status" "ReconciliationBatchStatus" NOT NULL DEFAULT 'PENDING',
    "file_name" TEXT,
    "imported_by" TEXT,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "matched_count" INTEGER NOT NULL DEFAULT 0,
    "divergent_count" INTEGER NOT NULL DEFAULT 0,
    "metadata_json" JSONB,
    "imported_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "reconciliation_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_items" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "batch_id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "external_reference" TEXT,
    "provider_reference" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "transaction_date" TIMESTAMPTZ(3),
    "status" "ReconciliationItemStatus" NOT NULL DEFAULT 'PENDING',
    "charge_id" UUID,
    "payment_id" UUID,
    "payment_entry_id" UUID,
    "expected_amount" DECIMAL(14,2),
    "difference_amount" DECIMAL(14,2),
    "match_notes" TEXT,
    "matched_at" TIMESTAMPTZ(3),
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "provider_account_id" UUID,
    "source_system" TEXT NOT NULL,
    "external_reference" TEXT NOT NULL,
    "provider" "ProviderType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "billing_cycle" "BillingCycle" NOT NULL,
    "payment_method" TEXT NOT NULL,
    "next_due_date" TIMESTAMPTZ(3),
    "provider_subscription_id" TEXT,
    "description" TEXT,
    "metadata_json" JSONB,
    "raw_provider_payload" JSONB,
    "cancelled_at" TIMESTAMPTZ(3),
    "paused_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_cycles" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "subscription_id" UUID NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "charge_id" UUID,
    "status" "SubscriptionCycleStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(14,2) NOT NULL,
    "due_date" TIMESTAMPTZ(3) NOT NULL,
    "paid_at" TIMESTAMPTZ(3),
    "provider_charge_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subscription_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "splits" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "charge_id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "type" "SplitType" NOT NULL,
    "amount" DECIMAL(14,2),
    "percentage" DECIMAL(8,4),
    "provider_split_id" TEXT,
    "status" "SplitStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "tenant_id" UUID NOT NULL,
    "merchant_id" UUID NOT NULL,
    "recipient_id" UUID,
    "amount" DECIMAL(14,2) NOT NULL,
    "fee_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "ProviderType",
    "provider_transfer_id" TEXT,
    "bank_account_json" JSONB,
    "failure_reason" TEXT,
    "metadata_json" JSONB,
    "processed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "merchants_tenant_id_idx" ON "merchants"("tenant_id");

-- CreateIndex
CREATE INDEX "provider_accounts_tenant_id_merchant_id_idx" ON "provider_accounts"("tenant_id", "merchant_id");

-- CreateIndex
CREATE INDEX "payment_customers_tenant_id_merchant_id_idx" ON "payment_customers"("tenant_id", "merchant_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_customers_tenant_id_merchant_id_cpf_cnpj_key" ON "payment_customers"("tenant_id", "merchant_id", "cpf_cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "provider_customers_provider_account_id_provider_customer_id_key" ON "provider_customers"("provider_account_id", "provider_customer_id");

-- CreateIndex
CREATE INDEX "charges_tenant_id_status_idx" ON "charges"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "charges_idempotency_key_idx" ON "charges"("idempotency_key");

-- CreateIndex
CREATE INDEX "charges_subscription_id_idx" ON "charges"("subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "charges_tenant_id_source_system_external_reference_key" ON "charges"("tenant_id", "source_system", "external_reference");

-- CreateIndex
CREATE INDEX "charge_items_charge_id_idx" ON "charge_items"("charge_id");

-- CreateIndex
CREATE INDEX "payment_attempts_charge_id_idx" ON "payment_attempts"("charge_id");

-- CreateIndex
CREATE INDEX "payments_charge_id_idx" ON "payments"("charge_id");

-- CreateIndex
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "provider_webhook_events_provider_event_id_idx" ON "provider_webhook_events"("provider", "event_id");

-- CreateIndex
CREATE INDEX "provider_webhook_events_status_idx" ON "provider_webhook_events"("status");

-- CreateIndex
CREATE INDEX "internal_webhook_deliveries_tenant_id_status_idx" ON "internal_webhook_deliveries"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "provider_requests_tenant_id_provider_idx" ON "provider_requests"("tenant_id", "provider");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_tenant_id_source_system_key_key" ON "idempotency_keys"("tenant_id", "source_system", "key");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_resource_type_idx" ON "audit_logs"("tenant_id", "resource_type");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "consumer_webhooks_tenant_id_status_idx" ON "consumer_webhooks"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "payment_entries_tenant_id_payment_id_idx" ON "payment_entries"("tenant_id", "payment_id");

-- CreateIndex
CREATE INDEX "payment_entries_charge_id_idx" ON "payment_entries"("charge_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_payment_id_key" ON "settlements"("payment_id");

-- CreateIndex
CREATE INDEX "settlements_tenant_id_status_idx" ON "settlements"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "settlements_expected_available_at_idx" ON "settlements"("expected_available_at");

-- CreateIndex
CREATE INDEX "reconciliation_batches_tenant_id_status_idx" ON "reconciliation_batches"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "reconciliation_items_batch_id_status_idx" ON "reconciliation_items"("batch_id", "status");

-- CreateIndex
CREATE INDEX "reconciliation_items_tenant_id_external_reference_idx" ON "reconciliation_items"("tenant_id", "external_reference");

-- CreateIndex
CREATE INDEX "subscriptions_tenant_id_status_idx" ON "subscriptions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "subscriptions_provider_subscription_id_idx" ON "subscriptions"("provider_subscription_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_tenant_id_source_system_external_reference_key" ON "subscriptions"("tenant_id", "source_system", "external_reference");

-- CreateIndex
CREATE INDEX "subscription_cycles_subscription_id_status_idx" ON "subscription_cycles"("subscription_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_cycles_subscription_id_cycle_number_key" ON "subscription_cycles"("subscription_id", "cycle_number");

-- CreateIndex
CREATE INDEX "splits_charge_id_idx" ON "splits"("charge_id");

-- CreateIndex
CREATE INDEX "splits_tenant_id_recipient_id_idx" ON "splits"("tenant_id", "recipient_id");

-- CreateIndex
CREATE INDEX "transfers_tenant_id_merchant_id_idx" ON "transfers"("tenant_id", "merchant_id");

-- CreateIndex
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_customers" ADD CONSTRAINT "payment_customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_customers" ADD CONSTRAINT "payment_customers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_customers" ADD CONSTRAINT "provider_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "payment_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_customers" ADD CONSTRAINT "provider_customers_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charge_items" ADD CONSTRAINT "charge_items_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_webhook_events" ADD CONSTRAINT "provider_webhook_events_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_webhook_deliveries" ADD CONSTRAINT "internal_webhook_deliveries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_requests" ADD CONSTRAINT "provider_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_requests" ADD CONSTRAINT "provider_requests_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_requests" ADD CONSTRAINT "provider_requests_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumer_webhooks" ADD CONSTRAINT "consumer_webhooks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_entries" ADD CONSTRAINT "payment_entries_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_batches" ADD CONSTRAINT "reconciliation_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "reconciliation_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_payment_entry_id_fkey" FOREIGN KEY ("payment_entry_id") REFERENCES "payment_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "payment_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_provider_account_id_fkey" FOREIGN KEY ("provider_account_id") REFERENCES "provider_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_cycles" ADD CONSTRAINT "subscription_cycles_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splits" ADD CONSTRAINT "splits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "splits" ADD CONSTRAINT "splits_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

