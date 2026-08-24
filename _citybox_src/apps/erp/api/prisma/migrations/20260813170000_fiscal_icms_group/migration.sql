-- Grupo de ICMS (spec erp/016) — resolve B1
-- Estende fiscal_groups com a situação de ICMS, cria a tabela filha de alíquotas
-- por UF e adiciona a FK de grupo em product_fiscals / product_fiscal_branches.
-- ⚠️ DB erp (citybox_platform) não provisionado neste ambiente — migration
--    versionada, aplicada via `prisma migrate deploy` no ambiente correto.

-- fiscal_groups: situação de ICMS (usada quando tax_type = ICMS)
ALTER TABLE "erp"."fiscal_groups"
  ADD COLUMN "icms_cst" TEXT,
  ADD COLUMN "icms_csosn" TEXT;

-- Alíquotas de ICMS por UF (grupo × UF × tipo INTERNA|INTERESTADUAL)
CREATE TABLE "erp"."fiscal_group_uf_rates" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "fiscal_group_id" TEXT NOT NULL,
  "uf" TEXT NOT NULL,
  "rate_type" TEXT NOT NULL,
  "aliquota" DECIMAL(7,4) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "fiscal_group_uf_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fiscal_group_uf_rates_fiscal_group_id_uf_rate_type_key"
  ON "erp"."fiscal_group_uf_rates"("fiscal_group_id", "uf", "rate_type");
CREATE INDEX "fiscal_group_uf_rates_organization_id_idx"
  ON "erp"."fiscal_group_uf_rates"("organization_id");
CREATE INDEX "fiscal_group_uf_rates_fiscal_group_id_idx"
  ON "erp"."fiscal_group_uf_rates"("fiscal_group_id");

ALTER TABLE "erp"."fiscal_group_uf_rates"
  ADD CONSTRAINT "fiscal_group_uf_rates_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "erp"."organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "erp"."fiscal_group_uf_rates"
  ADD CONSTRAINT "fiscal_group_uf_rates_fiscal_group_id_fkey"
  FOREIGN KEY ("fiscal_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- product_fiscals: FK do grupo de ICMS
ALTER TABLE "erp"."product_fiscals"
  ADD COLUMN "icms_group_id" TEXT;
CREATE INDEX "product_fiscals_icms_group_id_idx"
  ON "erp"."product_fiscals"("icms_group_id");
ALTER TABLE "erp"."product_fiscals"
  ADD CONSTRAINT "product_fiscals_icms_group_id_fkey"
  FOREIGN KEY ("icms_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- product_fiscal_branches: override do grupo de ICMS por unidade
ALTER TABLE "erp"."product_fiscal_branches"
  ADD COLUMN "icms_group_id" TEXT;
CREATE INDEX "product_fiscal_branches_icms_group_id_idx"
  ON "erp"."product_fiscal_branches"("icms_group_id");
ALTER TABLE "erp"."product_fiscal_branches"
  ADD CONSTRAINT "product_fiscal_branches_icms_group_id_fkey"
  FOREIGN KEY ("icms_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
