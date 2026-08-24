-- CreateEnum
CREATE TYPE "PurchaseDeliveryStatus" AS ENUM ('pending', 'received');

-- CreateEnum
CREATE TYPE "PurchaseLineStatus" AS ENUM ('pending', 'received', 'cancelled');

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stock_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "delivery_status" "PurchaseDeliveryStatus" NOT NULL DEFAULT 'pending',
    "purchased_at" DATE NOT NULL,
    "series" TEXT NOT NULL DEFAULT '',
    "invoice_number" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "carrier_id" TEXT,
    "freight_cents" INTEGER NOT NULL DEFAULT 0,
    "discounts_cents" INTEGER NOT NULL DEFAULT 0,
    "other_expenses_cents" INTEGER NOT NULL DEFAULT 0,
    "stock_movement_id" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "purchase_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "cost_cents" INTEGER NOT NULL,
    "status" "PurchaseLineStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "purchase_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchases_organization_id_idx" ON "purchases"("organization_id");

-- CreateIndex
CREATE INDEX "purchases_stock_id_idx" ON "purchases"("stock_id");

-- CreateIndex
CREATE INDEX "purchases_supplier_id_idx" ON "purchases"("supplier_id");

-- CreateIndex
CREATE INDEX "purchases_carrier_id_idx" ON "purchases"("carrier_id");

-- CreateIndex
CREATE INDEX "purchases_organization_id_deleted_at_idx" ON "purchases"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "purchases_organization_id_delivery_status_idx" ON "purchases"("organization_id", "delivery_status");

-- CreateIndex
CREATE INDEX "purchases_organization_id_purchased_at_idx" ON "purchases"("organization_id", "purchased_at");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_id_organization_id_key" ON "purchases"("id", "organization_id");

-- CreateIndex
CREATE INDEX "purchase_lines_organization_id_idx" ON "purchase_lines"("organization_id");

-- CreateIndex
CREATE INDEX "purchase_lines_purchase_id_idx" ON "purchase_lines"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_lines_product_id_idx" ON "purchase_lines"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_lines_purchase_id_product_id_key" ON "purchase_lines"("purchase_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_lines_id_organization_id_key" ON "purchase_lines"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_stock_id_organization_id_fkey" FOREIGN KEY ("stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_organization_id_fkey" FOREIGN KEY ("supplier_id", "organization_id") REFERENCES "suppliers"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_carrier_id_fkey" FOREIGN KEY ("carrier_id") REFERENCES "carriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_purchase_id_organization_id_fkey" FOREIGN KEY ("purchase_id", "organization_id") REFERENCES "purchases"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
