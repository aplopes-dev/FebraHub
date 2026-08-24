-- CreateEnum
CREATE TYPE "StockLocation" AS ENUM ('proprio', 'externo', 'deposito');

-- CreateEnum
CREATE TYPE "StockProperty" AS ENUM ('proprio', 'terceiro');

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" "StockLocation" NOT NULL,
    "property" "StockProperty" NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "stock_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stocks_organization_id_idx" ON "stocks"("organization_id");

-- CreateIndex
CREATE INDEX "stocks_organization_id_name_idx" ON "stocks"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_id_organization_id_key" ON "stocks"("id", "organization_id");

-- CreateIndex
CREATE INDEX "stock_branches_organization_id_idx" ON "stock_branches"("organization_id");

-- CreateIndex
CREATE INDEX "stock_branches_branch_id_idx" ON "stock_branches"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_branches_stock_id_branch_id_key" ON "stock_branches"("stock_id", "branch_id");

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_branches" ADD CONSTRAINT "stock_branches_stock_id_organization_id_fkey" FOREIGN KEY ("stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_branches" ADD CONSTRAINT "stock_branches_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
