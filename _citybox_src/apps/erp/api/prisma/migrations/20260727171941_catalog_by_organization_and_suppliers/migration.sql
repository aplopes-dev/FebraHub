-- DropIndex
DROP INDEX "product_categories_store_id_idx";

-- DropIndex
DROP INDEX "product_categories_store_id_name_key";

-- DropIndex
DROP INDEX "products_store_id_deleted_at_idx";

-- DropIndex
DROP INDEX "products_store_id_idx";

-- DropIndex
DROP INDEX "products_store_id_sku_key";

-- DropIndex
DROP INDEX "products_store_id_type_idx";

-- DropIndex
DROP INDEX "units_of_measure_store_id_abbreviation_key";

-- DropIndex
DROP INDEX "units_of_measure_store_id_idx";

-- AlterTable
ALTER TABLE "product_categories" DROP COLUMN "store_id",
ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "store_id",
ADD COLUMN     "organization_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "units_of_measure" DROP COLUMN "store_id",
ADD COLUMN     "organization_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "product_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "person_type" "PersonType" NOT NULL,
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "document" TEXT NOT NULL,
    "state_registration" TEXT,
    "state_exempt" BOOLEAN NOT NULL DEFAULT false,
    "municipal_registration" TEXT,
    "sufama_registration" TEXT,
    "foundation_date" DATE,
    "note" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "commercial_phone" TEXT,
    "mobile_phone" TEXT,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "complement" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_suppliers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "supplier_code" TEXT,
    "conversion" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_branches_organization_id_idx" ON "product_branches"("organization_id");

-- CreateIndex
CREATE INDEX "product_branches_branch_id_idx" ON "product_branches"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_branches_product_id_branch_id_key" ON "product_branches"("product_id", "branch_id");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_idx" ON "suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "suppliers_organization_id_deleted_at_idx" ON "suppliers"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_organization_id_document_key" ON "suppliers"("organization_id", "document");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_id_organization_id_key" ON "suppliers"("id", "organization_id");

-- CreateIndex
CREATE INDEX "supplier_branches_organization_id_idx" ON "supplier_branches"("organization_id");

-- CreateIndex
CREATE INDEX "supplier_branches_branch_id_idx" ON "supplier_branches"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_branches_supplier_id_branch_id_key" ON "supplier_branches"("supplier_id", "branch_id");

-- CreateIndex
CREATE INDEX "product_suppliers_organization_id_idx" ON "product_suppliers"("organization_id");

-- CreateIndex
CREATE INDEX "product_suppliers_supplier_id_idx" ON "product_suppliers"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_suppliers_product_id_supplier_id_key" ON "product_suppliers"("product_id", "supplier_id");

-- CreateIndex
CREATE INDEX "product_categories_organization_id_idx" ON "product_categories"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_organization_id_name_key" ON "product_categories"("organization_id", "name");

-- CreateIndex
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");

-- CreateIndex
CREATE INDEX "products_organization_id_deleted_at_idx" ON "products"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "products_organization_id_type_idx" ON "products"("organization_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "products_organization_id_sku_key" ON "products"("organization_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_id_organization_id_key" ON "products"("id", "organization_id");

-- CreateIndex
CREATE INDEX "units_of_measure_organization_id_idx" ON "units_of_measure"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_organization_id_abbreviation_key" ON "units_of_measure"("organization_id", "abbreviation");

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units_of_measure" ADD CONSTRAINT "units_of_measure_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_branches" ADD CONSTRAINT "product_branches_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_branches" ADD CONSTRAINT "supplier_branches_supplier_id_organization_id_fkey" FOREIGN KEY ("supplier_id", "organization_id") REFERENCES "suppliers"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_branches" ADD CONSTRAINT "supplier_branches_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_organization_id_fkey" FOREIGN KEY ("supplier_id", "organization_id") REFERENCES "suppliers"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

