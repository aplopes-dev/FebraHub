-- Grupos do IPI (spec erp/019)
-- (1) situação de IPI em fiscal_groups (perfil fiscal reutilizável do produto)
-- (2) ipi_group_id em product_fiscals / product_fiscal_branches (FK do produto)
-- ⚠️ DB erp (citybox_platform) não provisionado neste ambiente — migration
--    versionada, aplicada via `prisma migrate deploy` no ambiente correto.

-- (1) fiscal_groups: situação de IPI (usada quando tax_type = IPI)
--   ipi_cst          = CST de saída (50/99 tributado → IPITrib; 51–55 → IPINT)
--   ipi_enquadramento = cEnq (Código de Enquadramento Legal, tabela versionada)
--   ipi_rate         = percentual (nulo quando o CST não é tributado)
ALTER TABLE "erp"."fiscal_groups"
  ADD COLUMN "ipi_cst" TEXT,
  ADD COLUMN "ipi_enquadramento" TEXT,
  ADD COLUMN "ipi_rate" DECIMAL(7,4);

-- Defesa em nível de banco (a entidade também valida) — mesmo padrão do
-- fiscal_groups_issqn_trib_type_check. Só CSTs de saída suportados; o v1 emite
-- só saída (tpNF '1'). NULL permitido para grupos de outros tributos.
ALTER TABLE "erp"."fiscal_groups"
  ADD CONSTRAINT "fiscal_groups_ipi_cst_check"
  CHECK ("ipi_cst" IS NULL OR "ipi_cst" IN ('50', '51', '52', '53', '54', '55', '99'));

-- (2) product_fiscals: FK do grupo de IPI
ALTER TABLE "erp"."product_fiscals"
  ADD COLUMN "ipi_group_id" TEXT;
CREATE INDEX "product_fiscals_ipi_group_id_idx"
  ON "erp"."product_fiscals"("ipi_group_id");
ALTER TABLE "erp"."product_fiscals"
  ADD CONSTRAINT "product_fiscals_ipi_group_id_fkey"
  FOREIGN KEY ("ipi_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- product_fiscal_branches: override do grupo de IPI por unidade
ALTER TABLE "erp"."product_fiscal_branches"
  ADD COLUMN "ipi_group_id" TEXT;
CREATE INDEX "product_fiscal_branches_ipi_group_id_idx"
  ON "erp"."product_fiscal_branches"("ipi_group_id");
ALTER TABLE "erp"."product_fiscal_branches"
  ADD CONSTRAINT "product_fiscal_branches_ipi_group_id_fkey"
  FOREIGN KEY ("ipi_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
