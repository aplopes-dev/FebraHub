-- CreateTable
CREATE TABLE "product_fiscals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ncm" TEXT NOT NULL DEFAULT '',
    "origin" TEXT NOT NULL DEFAULT '',
    "net_weight_kg" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "gross_weight_kg" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "cest" TEXT NOT NULL DEFAULT '',
    "fcp_percent" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "fcp_st_percent" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "fcp_st_retained_percent" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "cst_ibs_cbs" TEXT NOT NULL DEFAULT '',
    "tax_classification" TEXT NOT NULL DEFAULT '',
    "icms" TEXT NOT NULL DEFAULT '',
    "icms_apply_to_all" BOOLEAN NOT NULL DEFAULT true,
    "pis_cofins" TEXT NOT NULL DEFAULT '',
    "pis_cofins_apply_to_all" BOOLEAN NOT NULL DEFAULT true,
    "ipi" TEXT NOT NULL DEFAULT '',
    "ipi_apply_to_all" BOOLEAN NOT NULL DEFAULT true,
    "cfop" TEXT NOT NULL DEFAULT '',
    "cfop_apply_to_all" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_fiscals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_fiscal_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_fiscal_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "icms" TEXT NOT NULL DEFAULT '',
    "pis_cofins" TEXT NOT NULL DEFAULT '',
    "ipi" TEXT NOT NULL DEFAULT '',
    "cfop" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "product_fiscal_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_fiscals_product_id_key" ON "product_fiscals"("product_id");

-- CreateIndex
CREATE INDEX "product_fiscals_organization_id_idx" ON "product_fiscals"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_fiscals_id_organization_id_key" ON "product_fiscals"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_fiscals_product_id_organization_id_key" ON "product_fiscals"("product_id", "organization_id");

-- CreateIndex
CREATE INDEX "product_fiscal_branches_organization_id_idx" ON "product_fiscal_branches"("organization_id");

-- CreateIndex
CREATE INDEX "product_fiscal_branches_product_fiscal_id_idx" ON "product_fiscal_branches"("product_fiscal_id");

-- CreateIndex
CREATE INDEX "product_fiscal_branches_branch_id_idx" ON "product_fiscal_branches"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_fiscal_branches_product_id_branch_id_key" ON "product_fiscal_branches"("product_id", "branch_id");

-- AddForeignKey
ALTER TABLE "product_fiscals" ADD CONSTRAINT "product_fiscals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fiscals" ADD CONSTRAINT "product_fiscals_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fiscal_branches" ADD CONSTRAINT "product_fiscal_branches_product_fiscal_id_fkey" FOREIGN KEY ("product_fiscal_id") REFERENCES "product_fiscals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fiscal_branches" ADD CONSTRAINT "product_fiscal_branches_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_fiscal_branches" ADD CONSTRAINT "product_fiscal_branches_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
