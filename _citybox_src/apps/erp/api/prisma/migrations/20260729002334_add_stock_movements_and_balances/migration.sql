-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('entrada', 'saida');

-- CreateEnum
CREATE TYPE "StockMovementSourceType" AS ENUM ('manual', 'transfer', 'inventory', 'purchase', 'production');

-- CreateTable
CREATE TABLE "stock_balances" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stock_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stock_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stock_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "type" "StockMovementType" NOT NULL,
    "operated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "source_type" "StockMovementSourceType" NOT NULL DEFAULT 'manual',
    "source_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stock_movement_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "cost_cents" INTEGER NOT NULL,

    CONSTRAINT "stock_movement_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_balances_organization_id_idx" ON "stock_balances"("organization_id");

-- CreateIndex
CREATE INDEX "stock_balances_product_id_idx" ON "stock_balances"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balances_stock_id_product_id_key" ON "stock_balances"("stock_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_balances_id_organization_id_key" ON "stock_balances"("id", "organization_id");

-- CreateIndex
CREATE INDEX "stock_movements_organization_id_idx" ON "stock_movements"("organization_id");

-- CreateIndex
CREATE INDEX "stock_movements_organization_id_operated_at_idx" ON "stock_movements"("organization_id", "operated_at");

-- CreateIndex
CREATE INDEX "stock_movements_organization_id_type_idx" ON "stock_movements"("organization_id", "type");

-- CreateIndex
CREATE INDEX "stock_movements_stock_id_idx" ON "stock_movements"("stock_id");

-- CreateIndex
CREATE INDEX "stock_movements_category_id_idx" ON "stock_movements"("category_id");

-- CreateIndex
CREATE INDEX "stock_movements_created_by_user_id_idx" ON "stock_movements"("created_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movements_id_organization_id_key" ON "stock_movements"("id", "organization_id");

-- CreateIndex
CREATE INDEX "stock_movement_lines_organization_id_idx" ON "stock_movement_lines"("organization_id");

-- CreateIndex
CREATE INDEX "stock_movement_lines_stock_movement_id_idx" ON "stock_movement_lines"("stock_movement_id");

-- CreateIndex
CREATE INDEX "stock_movement_lines_product_id_idx" ON "stock_movement_lines"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movement_lines_id_organization_id_key" ON "stock_movement_lines"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_stock_id_organization_id_fkey" FOREIGN KEY ("stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_balances" ADD CONSTRAINT "stock_balances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_id_organization_id_fkey" FOREIGN KEY ("stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_category_id_organization_id_fkey" FOREIGN KEY ("category_id", "organization_id") REFERENCES "movement_categories"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_lines" ADD CONSTRAINT "stock_movement_lines_stock_movement_id_organization_id_fkey" FOREIGN KEY ("stock_movement_id", "organization_id") REFERENCES "stock_movements"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement_lines" ADD CONSTRAINT "stock_movement_lines_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
