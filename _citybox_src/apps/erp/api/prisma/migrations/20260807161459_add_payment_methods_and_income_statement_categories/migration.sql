-- CreateEnum
CREATE TYPE "FinancialGroupSign" AS ENUM ('positive', 'negative');

-- AlterTable
ALTER TABLE "financial_groups" ADD COLUMN     "catalog_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sign" "FinancialGroupSign";

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscal_code" TEXT,
    "installment_permission" TEXT,
    "system_key" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_methods_organization_id_deleted_at_idx" ON "payment_methods"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_organization_id_name_key" ON "payment_methods"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_organization_id_system_key_key" ON "payment_methods"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_id_organization_id_key" ON "payment_methods"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
