-- CreateEnum
CREATE TYPE "ProductionType" AS ENUM ('automatic', 'productive_process');

-- CreateTable
CREATE TABLE "technical_sheets" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "production_type" "ProductionType" NOT NULL,
    "max_removable_components" INTEGER NOT NULL DEFAULT 0,
    "markup_percent" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "technical_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_sheet_components" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "technical_sheet_id" TEXT NOT NULL,
    "component_product_id" TEXT NOT NULL,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "quantity" DECIMAL(18,6) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "technical_sheet_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "technical_sheet_option_components" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "technical_sheet_id" TEXT NOT NULL,
    "variation_option_id" TEXT NOT NULL,
    "component_product_id" TEXT NOT NULL,
    "optional" BOOLEAN NOT NULL DEFAULT false,
    "quantity" DECIMAL(18,6) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "technical_sheet_option_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "technical_sheets_product_id_key" ON "technical_sheets"("product_id");

-- CreateIndex
CREATE INDEX "technical_sheets_organization_id_idx" ON "technical_sheets"("organization_id");

-- CreateIndex
CREATE INDEX "technical_sheets_organization_id_production_type_idx" ON "technical_sheets"("organization_id", "production_type");

-- CreateIndex
CREATE UNIQUE INDEX "technical_sheets_id_organization_id_key" ON "technical_sheets"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "technical_sheets_product_id_organization_id_key" ON "technical_sheets"("product_id", "organization_id");

-- CreateIndex
CREATE INDEX "technical_sheet_components_organization_id_idx" ON "technical_sheet_components"("organization_id");

-- CreateIndex
CREATE INDEX "technical_sheet_components_component_product_id_idx" ON "technical_sheet_components"("component_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "technical_sheet_components_technical_sheet_id_component_pro_key" ON "technical_sheet_components"("technical_sheet_id", "component_product_id");

-- CreateIndex
CREATE INDEX "technical_sheet_option_components_organization_id_idx" ON "technical_sheet_option_components"("organization_id");

-- CreateIndex
CREATE INDEX "technical_sheet_option_components_variation_option_id_idx" ON "technical_sheet_option_components"("variation_option_id");

-- CreateIndex
CREATE INDEX "technical_sheet_option_components_component_product_id_idx" ON "technical_sheet_option_components"("component_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "technical_sheet_option_components_technical_sheet_id_variat_key" ON "technical_sheet_option_components"("technical_sheet_id", "variation_option_id", "component_product_id");

-- AddForeignKey
ALTER TABLE "technical_sheets" ADD CONSTRAINT "technical_sheets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_sheets" ADD CONSTRAINT "technical_sheets_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_sheet_components" ADD CONSTRAINT "technical_sheet_components_technical_sheet_id_organization_fkey" FOREIGN KEY ("technical_sheet_id", "organization_id") REFERENCES "technical_sheets"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_sheet_components" ADD CONSTRAINT "technical_sheet_components_component_product_id_organizati_fkey" FOREIGN KEY ("component_product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_sheet_option_components" ADD CONSTRAINT "technical_sheet_option_components_technical_sheet_id_organ_fkey" FOREIGN KEY ("technical_sheet_id", "organization_id") REFERENCES "technical_sheets"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_sheet_option_components" ADD CONSTRAINT "technical_sheet_option_components_variation_option_id_orga_fkey" FOREIGN KEY ("variation_option_id", "organization_id") REFERENCES "variation_options"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "technical_sheet_option_components" ADD CONSTRAINT "technical_sheet_option_components_component_product_id_org_fkey" FOREIGN KEY ("component_product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
