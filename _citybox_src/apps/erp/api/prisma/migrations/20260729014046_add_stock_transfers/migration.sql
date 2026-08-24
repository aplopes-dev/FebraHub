-- CreateEnum
CREATE TYPE "StockTransferStatus" AS ENUM ('active', 'cancelled');

-- CreateTable
CREATE TABLE "stock_transfers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "from_stock_id" TEXT NOT NULL,
    "to_stock_id" TEXT NOT NULL,
    "status" "StockTransferStatus" NOT NULL DEFAULT 'active',
    "operated_at" TIMESTAMPTZ(3) NOT NULL,
    "carrier_id" TEXT,
    "responsible_name" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "outbound_movement_id" TEXT,
    "inbound_movement_id" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "cancelled_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_transfer_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stock_transfer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "batch" TEXT,

    CONSTRAINT "stock_transfer_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_transfers_organization_id_idx" ON "stock_transfers"("organization_id");

-- CreateIndex
CREATE INDEX "stock_transfers_from_stock_id_idx" ON "stock_transfers"("from_stock_id");

-- CreateIndex
CREATE INDEX "stock_transfers_to_stock_id_idx" ON "stock_transfers"("to_stock_id");

-- CreateIndex
CREATE INDEX "stock_transfers_organization_id_status_idx" ON "stock_transfers"("organization_id", "status");

-- CreateIndex
CREATE INDEX "stock_transfers_organization_id_operated_at_idx" ON "stock_transfers"("organization_id", "operated_at");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfers_id_organization_id_key" ON "stock_transfers"("id", "organization_id");

-- CreateIndex
CREATE INDEX "stock_transfer_lines_organization_id_idx" ON "stock_transfer_lines"("organization_id");

-- CreateIndex
CREATE INDEX "stock_transfer_lines_stock_transfer_id_idx" ON "stock_transfer_lines"("stock_transfer_id");

-- CreateIndex
CREATE INDEX "stock_transfer_lines_product_id_idx" ON "stock_transfer_lines"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_lines_stock_transfer_id_product_id_key" ON "stock_transfer_lines"("stock_transfer_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_transfer_lines_id_organization_id_key" ON "stock_transfer_lines"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_from_stock_id_organization_id_fkey" FOREIGN KEY ("from_stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_to_stock_id_organization_id_fkey" FOREIGN KEY ("to_stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_stock_transfer_id_organization_id_fkey" FOREIGN KEY ("stock_transfer_id", "organization_id") REFERENCES "stock_transfers"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
