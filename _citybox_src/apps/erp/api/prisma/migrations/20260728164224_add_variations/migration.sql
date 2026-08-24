-- CreateEnum
CREATE TYPE "VariationPriceMethod" AS ENUM ('sum', 'average', 'highest');

-- CreateEnum
CREATE TYPE "ProductVariationFormat" AS ENUM ('grid', 'composite');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "variation_format" "ProductVariationFormat";

-- CreateTable
CREATE TABLE "variations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "choose_from" INTEGER NOT NULL DEFAULT 1,
    "choose_to" INTEGER NOT NULL DEFAULT 1,
    "charge_from_selected_quantity" BOOLEAN NOT NULL DEFAULT false,
    "charge_from_quantity" INTEGER NOT NULL DEFAULT 1,
    "price_method" "VariationPriceMethod" NOT NULL DEFAULT 'sum',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variation_options" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "variation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image_url" VARCHAR(2048),
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "code" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "variation_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variation_id" TEXT NOT NULL,
    "min_choices" INTEGER NOT NULL DEFAULT 1,
    "max_choices" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_variations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variation_options" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_variation_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "price_cents" INTEGER,
    "barcode" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_variation_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variations_organization_id_idx" ON "variations"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "variations_id_organization_id_key" ON "variations"("id", "organization_id");

-- CreateIndex
CREATE INDEX "variation_options_organization_id_idx" ON "variation_options"("organization_id");

-- CreateIndex
CREATE INDEX "variation_options_variation_id_idx" ON "variation_options"("variation_id");

-- CreateIndex
CREATE UNIQUE INDEX "variation_options_id_organization_id_key" ON "variation_options"("id", "organization_id");

-- CreateIndex
CREATE INDEX "product_variations_organization_id_idx" ON "product_variations"("organization_id");

-- CreateIndex
CREATE INDEX "product_variations_variation_id_idx" ON "product_variations"("variation_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variations_product_id_variation_id_key" ON "product_variations"("product_id", "variation_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variations_id_organization_id_key" ON "product_variations"("id", "organization_id");

-- CreateIndex
CREATE INDEX "product_variation_options_organization_id_idx" ON "product_variation_options"("organization_id");

-- CreateIndex
CREATE INDEX "product_variation_options_option_id_idx" ON "product_variation_options"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variation_options_product_variation_id_option_id_key" ON "product_variation_options"("product_variation_id", "option_id");

-- AddForeignKey
ALTER TABLE "variations" ADD CONSTRAINT "variations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variation_options" ADD CONSTRAINT "variation_options_variation_id_organization_id_fkey" FOREIGN KEY ("variation_id", "organization_id") REFERENCES "variations"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variations" ADD CONSTRAINT "product_variations_variation_id_organization_id_fkey" FOREIGN KEY ("variation_id", "organization_id") REFERENCES "variations"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variation_options" ADD CONSTRAINT "product_variation_options_product_variation_id_organizatio_fkey" FOREIGN KEY ("product_variation_id", "organization_id") REFERENCES "product_variations"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variation_options" ADD CONSTRAINT "product_variation_options_option_id_organization_id_fkey" FOREIGN KEY ("option_id", "organization_id") REFERENCES "variation_options"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
