-- CreateEnum
CREATE TYPE "ProductionOrderStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ProductionHistoryKind" AS ENUM ('system', 'comment');

-- CreateTable
CREATE TABLE "production_orders" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "planned_quantity" DECIMAL(18,6) NOT NULL,
    "produced_quantity" DECIMAL(18,6),
    "source_stock_id" TEXT NOT NULL,
    "destination_stock_id" TEXT NOT NULL,
    "expected_date" DATE NOT NULL,
    "status" "ProductionOrderStatus" NOT NULL DEFAULT 'pending',
    "observation" TEXT,
    "outbound_movement_id" TEXT,
    "inbound_movement_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_history_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "production_order_id" TEXT NOT NULL,
    "kind" "ProductionHistoryKind" NOT NULL DEFAULT 'system',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "user_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_orders_organization_id_idx" ON "production_orders"("organization_id");

-- CreateIndex
CREATE INDEX "production_orders_organization_id_status_idx" ON "production_orders"("organization_id", "status");

-- CreateIndex
CREATE INDEX "production_orders_product_id_idx" ON "production_orders"("product_id");

-- CreateIndex
CREATE INDEX "production_orders_source_stock_id_idx" ON "production_orders"("source_stock_id");

-- CreateIndex
CREATE INDEX "production_orders_destination_stock_id_idx" ON "production_orders"("destination_stock_id");

-- CreateIndex
CREATE INDEX "production_orders_created_by_user_id_idx" ON "production_orders"("created_by_user_id");

-- CreateIndex
CREATE INDEX "production_orders_organization_id_expected_date_idx" ON "production_orders"("organization_id", "expected_date");

-- CreateIndex
CREATE UNIQUE INDEX "production_orders_id_organization_id_key" ON "production_orders"("id", "organization_id");

-- CreateIndex
CREATE INDEX "production_history_entries_organization_id_idx" ON "production_history_entries"("organization_id");

-- CreateIndex
CREATE INDEX "production_history_entries_production_order_id_idx" ON "production_history_entries"("production_order_id");

-- CreateIndex
CREATE INDEX "production_history_entries_production_order_id_created_at_idx" ON "production_history_entries"("production_order_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "production_history_entries_id_organization_id_key" ON "production_history_entries"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_source_stock_id_organization_id_fkey" FOREIGN KEY ("source_stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_destination_stock_id_organization_id_fkey" FOREIGN KEY ("destination_stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_history_entries" ADD CONSTRAINT "production_history_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_history_entries" ADD CONSTRAINT "production_history_entries_production_order_id_organizatio_fkey" FOREIGN KEY ("production_order_id", "organization_id") REFERENCES "production_orders"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
