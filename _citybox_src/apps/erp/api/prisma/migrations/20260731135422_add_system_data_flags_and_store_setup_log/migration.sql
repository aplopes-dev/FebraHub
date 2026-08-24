-- AlterTable
ALTER TABLE "chart_of_accounts" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- AlterTable
ALTER TABLE "contract_statuses" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- AlterTable
ALTER TABLE "cost_centers" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- AlterTable
ALTER TABLE "financial_groups" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- AlterTable
ALTER TABLE "product_categories" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- AlterTable
ALTER TABLE "service_order_statuses" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- AlterTable
ALTER TABLE "stocks" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- AlterTable
ALTER TABLE "units_of_measure" ADD COLUMN     "is_system" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "system_key" TEXT;

-- CreateTable
CREATE TABLE "store_setup_logs" (
    "organization_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "store_setup_logs_pkey" PRIMARY KEY ("organization_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chart_of_accounts_organization_id_system_key_key" ON "chart_of_accounts"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "contract_statuses_organization_id_system_key_key" ON "contract_statuses"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_organization_id_system_key_key" ON "cost_centers"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "financial_groups_organization_id_system_key_key" ON "financial_groups"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_organization_id_system_key_key" ON "product_categories"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_statuses_organization_id_system_key_key" ON "service_order_statuses"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_organization_id_system_key_key" ON "stocks"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_organization_id_system_key_key" ON "units_of_measure"("organization_id", "system_key");

-- AddForeignKey
ALTER TABLE "store_setup_logs" ADD CONSTRAINT "store_setup_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

