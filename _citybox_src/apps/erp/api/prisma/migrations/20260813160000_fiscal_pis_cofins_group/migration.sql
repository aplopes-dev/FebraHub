-- Grupo de PIS/COFINS (spec erp/015)
-- Estende fiscal_groups com a regra de PIS/COFINS e adiciona a FK de grupo
-- em product_fiscals / product_fiscal_branches.
-- ⚠️ DB erp (citybox_platform) não provisionado neste ambiente — migration
--    versionada, aplicada via `prisma migrate deploy` no ambiente correto.

-- fiscal_groups: regra de PIS/COFINS (usada quando tax_type = PIS_COFINS)
ALTER TABLE "erp"."fiscal_groups"
  ADD COLUMN "pis_cst" TEXT,
  ADD COLUMN "pis_aliquota" DECIMAL(7,4),
  ADD COLUMN "cofins_cst" TEXT,
  ADD COLUMN "cofins_aliquota" DECIMAL(7,4);

-- product_fiscals: FK do grupo de PIS/COFINS
ALTER TABLE "erp"."product_fiscals"
  ADD COLUMN "pis_cofins_group_id" TEXT;

CREATE INDEX "product_fiscals_pis_cofins_group_id_idx"
  ON "erp"."product_fiscals"("pis_cofins_group_id");

ALTER TABLE "erp"."product_fiscals"
  ADD CONSTRAINT "product_fiscals_pis_cofins_group_id_fkey"
  FOREIGN KEY ("pis_cofins_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- product_fiscal_branches: override do grupo por unidade
ALTER TABLE "erp"."product_fiscal_branches"
  ADD COLUMN "pis_cofins_group_id" TEXT;

CREATE INDEX "product_fiscal_branches_pis_cofins_group_id_idx"
  ON "erp"."product_fiscal_branches"("pis_cofins_group_id");

ALTER TABLE "erp"."product_fiscal_branches"
  ADD CONSTRAINT "product_fiscal_branches_pis_cofins_group_id_fkey"
  FOREIGN KEY ("pis_cofins_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
