-- CreateTable
CREATE TABLE "product_addons" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_price_cents" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_addon_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "min_quantity" INTEGER NOT NULL DEFAULT 0,
    "max_quantity" INTEGER NOT NULL DEFAULT 0,
    "charge_from_selected_quantity" BOOLEAN NOT NULL DEFAULT false,
    "charge_from_quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_addon_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_addon_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "addon_id" TEXT NOT NULL,
    "max_quantity" INTEGER NOT NULL DEFAULT 1,
    "price_cents" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_addon_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_suggestions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "suggested_product_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_addons_organization_id_idx" ON "product_addons"("organization_id");

-- CreateIndex
CREATE INDEX "product_addons_organization_id_deleted_at_idx" ON "product_addons"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_addons_organization_id_name_key" ON "product_addons"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "product_addons_id_organization_id_key" ON "product_addons"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_addon_settings_product_id_key" ON "product_addon_settings"("product_id");

-- CreateIndex
CREATE INDEX "product_addon_settings_organization_id_idx" ON "product_addon_settings"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_addon_settings_product_id_organization_id_key" ON "product_addon_settings"("product_id", "organization_id");

-- CreateIndex
CREATE INDEX "product_addon_lines_organization_id_idx" ON "product_addon_lines"("organization_id");

-- CreateIndex
CREATE INDEX "product_addon_lines_addon_id_idx" ON "product_addon_lines"("addon_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_addon_lines_product_id_addon_id_key" ON "product_addon_lines"("product_id", "addon_id");

-- CreateIndex
CREATE INDEX "product_suggestions_organization_id_idx" ON "product_suggestions"("organization_id");

-- CreateIndex
CREATE INDEX "product_suggestions_suggested_product_id_idx" ON "product_suggestions"("suggested_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_suggestions_product_id_suggested_product_id_key" ON "product_suggestions"("product_id", "suggested_product_id");

-- AddForeignKey
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addon_settings" ADD CONSTRAINT "product_addon_settings_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addon_lines" ADD CONSTRAINT "product_addon_lines_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_addon_lines" ADD CONSTRAINT "product_addon_lines_addon_id_organization_id_fkey" FOREIGN KEY ("addon_id", "organization_id") REFERENCES "product_addons"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suggestions" ADD CONSTRAINT "product_suggestions_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suggestions" ADD CONSTRAINT "product_suggestions_suggested_product_id_organization_id_fkey" FOREIGN KEY ("suggested_product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
