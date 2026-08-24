-- CreateTable
CREATE TABLE "nfe_issuances" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sale_order_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "access_key" TEXT,
    "protocol" TEXT,
    "status" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "nfe_issuances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nfe_issuances_organization_id_company_id_idx" ON "nfe_issuances"("organization_id", "company_id");

-- CreateIndex
CREATE INDEX "nfe_issuances_organization_id_created_at_id_idx" ON "nfe_issuances"("organization_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "nfe_issuances_sale_order_unique" ON "nfe_issuances"("sale_order_id", "organization_id");

-- AddForeignKey
ALTER TABLE "nfe_issuances" ADD CONSTRAINT "nfe_issuances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nfe_issuances" ADD CONSTRAINT "nfe_issuances_sale_order_id_organization_id_fkey" FOREIGN KEY ("sale_order_id", "organization_id") REFERENCES "sale_orders"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
