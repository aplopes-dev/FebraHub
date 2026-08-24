-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('simple', 'collection', 'supply');

-- CreateEnum
CREATE TYPE "UnitKind" AS ENUM ('unit', 'weight', 'volume', 'length', 'area');

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units_of_measure" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "kind" "UnitKind" NOT NULL,
    "decimal_places" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "unit_of_measure_id" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'simple',
    "base_price_cents" INTEGER NOT NULL DEFAULT 0,
    "perishable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "image_url" VARCHAR(2048),
    "track_stock" BOOLEAN NOT NULL DEFAULT false,
    "barcodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "has_variants" BOOLEAN NOT NULL DEFAULT false,
    "variants_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_categories_store_id_idx" ON "product_categories"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_store_id_name_key" ON "product_categories"("store_id", "name");

-- CreateIndex
CREATE INDEX "units_of_measure_store_id_idx" ON "units_of_measure"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_store_id_abbreviation_key" ON "units_of_measure"("store_id", "abbreviation");

-- CreateIndex
CREATE INDEX "products_store_id_idx" ON "products"("store_id");

-- CreateIndex
CREATE INDEX "products_store_id_deleted_at_idx" ON "products"("store_id", "deleted_at");

-- CreateIndex
CREATE INDEX "products_store_id_type_idx" ON "products"("store_id", "type");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_sku_key" ON "products"("store_id", "sku");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_unit_of_measure_id_fkey" FOREIGN KEY ("unit_of_measure_id") REFERENCES "units_of_measure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
