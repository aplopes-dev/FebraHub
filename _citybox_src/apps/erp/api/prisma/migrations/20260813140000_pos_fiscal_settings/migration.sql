-- CreateTable: configuração fiscal do PDV por organização (spec erp/013)
CREATE TABLE "erp"."pos_fiscal_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "pos_document_model" TEXT,
    "updated_by_user_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pos_fiscal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_fiscal_settings_organization_id_key" ON "erp"."pos_fiscal_settings"("organization_id");

-- AddForeignKey
ALTER TABLE "erp"."pos_fiscal_settings" ADD CONSTRAINT "pos_fiscal_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "erp"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
