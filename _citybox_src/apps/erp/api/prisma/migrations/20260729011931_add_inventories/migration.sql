-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('open', 'completed');

-- CreateTable
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stock_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'completed',
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "inventory_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "system_quantity" DECIMAL(18,6) NOT NULL,
    "counted_quantity" DECIMAL(18,6) NOT NULL,

    CONSTRAINT "inventory_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventories_organization_id_idx" ON "inventories"("organization_id");

-- CreateIndex
CREATE INDEX "inventories_stock_id_idx" ON "inventories"("stock_id");

-- CreateIndex
CREATE INDEX "inventories_organization_id_created_at_idx" ON "inventories"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_id_organization_id_key" ON "inventories"("id", "organization_id");

-- CreateIndex
CREATE INDEX "inventory_lines_organization_id_idx" ON "inventory_lines"("organization_id");

-- CreateIndex
CREATE INDEX "inventory_lines_inventory_id_idx" ON "inventory_lines"("inventory_id");

-- CreateIndex
CREATE INDEX "inventory_lines_product_id_idx" ON "inventory_lines"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lines_inventory_id_product_id_key" ON "inventory_lines"("inventory_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lines_id_organization_id_key" ON "inventory_lines"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_stock_id_organization_id_fkey" FOREIGN KEY ("stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lines" ADD CONSTRAINT "inventory_lines_inventory_id_organization_id_fkey" FOREIGN KEY ("inventory_id", "organization_id") REFERENCES "inventories"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lines" ADD CONSTRAINT "inventory_lines_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
