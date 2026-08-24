-- Naturezas de Operação (spec erp/020) — regras de-para entrada→saída
-- (1) operation_natures (pai) + (2) cfop_rules + (3) group_rules (ICMS/PIS_COFINS)
-- ⚠️ DB erp (citybox_platform) não provisionado neste ambiente — migration
--    versionada, aplicada via `prisma migrate deploy` no ambiente correto.

-- (1) pai
CREATE TABLE "erp"."operation_natures" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "keep_benefit_in_uf" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "operation_natures_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "operation_natures_id_organization_id_key"
  ON "erp"."operation_natures"("id", "organization_id");
CREATE INDEX "operation_natures_organization_id_idx"
  ON "erp"."operation_natures"("organization_id");
ALTER TABLE "erp"."operation_natures"
  ADD CONSTRAINT "operation_natures_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "erp"."organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- (2) regras de CFOP (entrada → saída + condição ICMS livre)
CREATE TABLE "erp"."operation_nature_cfop_rules" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "operation_nature_id" TEXT NOT NULL,
  "from_cfop" TEXT NOT NULL,
  "to_cfop" TEXT NOT NULL,
  "icms_livre" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "operation_nature_cfop_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "operation_nature_cfop_rules_organization_id_idx"
  ON "erp"."operation_nature_cfop_rules"("organization_id");
CREATE INDEX "operation_nature_cfop_rules_operation_nature_id_idx"
  ON "erp"."operation_nature_cfop_rules"("operation_nature_id");
-- Defesa em nível de banco (a entidade também valida) — condição ICMS livre.
ALTER TABLE "erp"."operation_nature_cfop_rules"
  ADD CONSTRAINT "operation_nature_cfop_rules_icms_livre_check"
  CHECK ("icms_livre" IN ('AMBOS', 'SIM', 'NAO'));
ALTER TABLE "erp"."operation_nature_cfop_rules"
  ADD CONSTRAINT "operation_nature_cfop_rules_operation_nature_id_fkey"
  FOREIGN KEY ("operation_nature_id") REFERENCES "erp"."operation_natures"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- (3) regras de grupo (ICMS / PIS_COFINS) — FK ao grupo em SetNull (regra órfã
-- é ignorada pelo resolvedor).
CREATE TABLE "erp"."operation_nature_group_rules" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "operation_nature_id" TEXT NOT NULL,
  "tax_type" TEXT NOT NULL,
  "from_group_id" TEXT,
  "to_group_id" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "operation_nature_group_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "operation_nature_group_rules_organization_id_idx"
  ON "erp"."operation_nature_group_rules"("organization_id");
CREATE INDEX "operation_nature_group_rules_operation_nature_id_idx"
  ON "erp"."operation_nature_group_rules"("operation_nature_id");
CREATE INDEX "operation_nature_group_rules_from_group_id_idx"
  ON "erp"."operation_nature_group_rules"("from_group_id");
CREATE INDEX "operation_nature_group_rules_to_group_id_idx"
  ON "erp"."operation_nature_group_rules"("to_group_id");
ALTER TABLE "erp"."operation_nature_group_rules"
  ADD CONSTRAINT "operation_nature_group_rules_tax_type_check"
  CHECK ("tax_type" IN ('ICMS', 'PIS_COFINS'));
ALTER TABLE "erp"."operation_nature_group_rules"
  ADD CONSTRAINT "operation_nature_group_rules_operation_nature_id_fkey"
  FOREIGN KEY ("operation_nature_id") REFERENCES "erp"."operation_natures"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "erp"."operation_nature_group_rules"
  ADD CONSTRAINT "operation_nature_group_rules_from_group_id_fkey"
  FOREIGN KEY ("from_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "erp"."operation_nature_group_rules"
  ADD CONSTRAINT "operation_nature_group_rules_to_group_id_fkey"
  FOREIGN KEY ("to_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
