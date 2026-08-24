-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "average_accept_time_seconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "average_ticket_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contingencia_offline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deployment_status" TEXT NOT NULL DEFAULT 'em_setup',
ADD COLUMN     "last_access_at" TIMESTAMPTZ(3),
ADD COLUMN     "last_order_at" TIMESTAMPTZ(3),
ADD COLUMN     "last_seen_at" TIMESTAMPTZ(3),
ADD COLUMN     "maintenance_mode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "orders_this_month" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "orders_today" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revenue_today_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sefaz_homologacao" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trial_ends_at" TIMESTAMPTZ(3),
ADD COLUMN     "visible_in_app" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "store_terminals" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_seen_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_errors" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_members" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_modules" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "module_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_integrations" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "integration_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_audit_events" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "actor" TEXT NOT NULL,
    "actor_role" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_terminals_store_id_idx" ON "store_terminals"("store_id");

-- CreateIndex
CREATE INDEX "store_errors_store_id_occurred_at_idx" ON "store_errors"("store_id", "occurred_at");

-- CreateIndex
CREATE INDEX "store_members_store_id_idx" ON "store_members"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_modules_store_id_module_key_key" ON "store_modules"("store_id", "module_key");

-- CreateIndex
CREATE UNIQUE INDEX "store_integrations_store_id_integration_key_key" ON "store_integrations"("store_id", "integration_key");

-- CreateIndex
CREATE INDEX "store_audit_events_store_id_occurred_at_idx" ON "store_audit_events"("store_id", "occurred_at");

-- AddForeignKey
ALTER TABLE "store_terminals" ADD CONSTRAINT "store_terminals_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_errors" ADD CONSTRAINT "store_errors_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_modules" ADD CONSTRAINT "store_modules_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_integrations" ADD CONSTRAINT "store_integrations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_audit_events" ADD CONSTRAINT "store_audit_events_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
