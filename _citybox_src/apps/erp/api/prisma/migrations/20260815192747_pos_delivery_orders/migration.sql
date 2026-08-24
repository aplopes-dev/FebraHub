-- CreateEnum
CREATE TYPE "PosDeliveryOrderStatus" AS ENUM ('received', 'preparing', 'dispatched', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PosDeliveryFulfillment" AS ENUM ('delivery', 'pickup');

-- AlterTable
ALTER TABLE "sale_orders" ADD COLUMN     "pos_delivery_order_id" TEXT;

-- CreateTable
CREATE TABLE "pos_delivery_orders" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "PosDeliveryOrderStatus" NOT NULL DEFAULT 'received',
    "fulfillment" "PosDeliveryFulfillment" NOT NULL DEFAULT 'delivery',
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL DEFAULT '',
    "address_zip_code" TEXT,
    "address_street" TEXT,
    "address_number" TEXT,
    "address_district" TEXT,
    "address_city" TEXT,
    "address_state" TEXT,
    "address_complement" TEXT,
    "address_text" TEXT NOT NULL DEFAULT '',
    "fee_cents" INTEGER NOT NULL DEFAULT 0,
    "courier_id" TEXT,
    "courier_name" TEXT,
    "pos_terminal_id" TEXT,
    "operator_user_id" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pos_delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_delivery_order_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "delivery_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "pos_delivery_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_delivery_orders_organization_id_branch_id_status_idx" ON "pos_delivery_orders"("organization_id", "branch_id", "status");

-- CreateIndex
CREATE INDEX "pos_delivery_orders_organization_id_branch_id_created_at_idx" ON "pos_delivery_orders"("organization_id", "branch_id", "created_at");

-- CreateIndex
CREATE INDEX "pos_delivery_orders_pos_terminal_id_idx" ON "pos_delivery_orders"("pos_terminal_id");

-- CreateIndex
CREATE INDEX "pos_delivery_orders_customer_id_idx" ON "pos_delivery_orders"("customer_id");

-- CreateIndex
CREATE INDEX "pos_delivery_orders_courier_id_idx" ON "pos_delivery_orders"("courier_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_delivery_orders_organization_id_branch_id_number_key" ON "pos_delivery_orders"("organization_id", "branch_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "pos_delivery_orders_id_organization_id_key" ON "pos_delivery_orders"("id", "organization_id");

-- CreateIndex
CREATE INDEX "pos_delivery_order_lines_organization_id_idx" ON "pos_delivery_order_lines"("organization_id");

-- CreateIndex
CREATE INDEX "pos_delivery_order_lines_delivery_order_id_idx" ON "pos_delivery_order_lines"("delivery_order_id");

-- CreateIndex
CREATE INDEX "pos_delivery_order_lines_product_id_idx" ON "pos_delivery_order_lines"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_delivery_order_lines_id_organization_id_key" ON "pos_delivery_order_lines"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sale_orders_organization_id_channel_id_idx" ON "sale_orders"("organization_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_orders_pos_delivery_order_id_organization_id_key" ON "sale_orders"("pos_delivery_order_id", "organization_id");

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_pos_delivery_order_id_organization_id_fkey" FOREIGN KEY ("pos_delivery_order_id", "organization_id") REFERENCES "pos_delivery_orders"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_orders" ADD CONSTRAINT "pos_delivery_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_orders" ADD CONSTRAINT "pos_delivery_orders_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_orders" ADD CONSTRAINT "pos_delivery_orders_customer_id_organization_id_fkey" FOREIGN KEY ("customer_id", "organization_id") REFERENCES "customers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_orders" ADD CONSTRAINT "pos_delivery_orders_courier_id_organization_id_fkey" FOREIGN KEY ("courier_id", "organization_id") REFERENCES "carriers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_orders" ADD CONSTRAINT "pos_delivery_orders_pos_terminal_id_organization_id_fkey" FOREIGN KEY ("pos_terminal_id", "organization_id") REFERENCES "pos_terminals"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_order_lines" ADD CONSTRAINT "pos_delivery_order_lines_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_order_lines" ADD CONSTRAINT "pos_delivery_order_lines_delivery_order_id_organization_id_fkey" FOREIGN KEY ("delivery_order_id", "organization_id") REFERENCES "pos_delivery_orders"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_delivery_order_lines" ADD CONSTRAINT "pos_delivery_order_lines_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
