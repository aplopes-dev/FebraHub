-- Padrões fiscais (spec erp/014)
-- Adiciona ISSQN a product_fiscal / product_fiscal_branches e cria
-- fiscal_groups (grupo fiscal por tributo) + fiscal_default_taxes (padrão por org).
-- ⚠️ DB erp (citybox_platform) não provisionado neste ambiente — migration versionada,
--    aplicada via `prisma migrate deploy` no ambiente correto.

-- product_fiscal: ISSQN (mesmo formato dos outros quatro tributos)
ALTER TABLE "erp"."product_fiscals"
  ADD COLUMN "issqn" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "issqn_apply_to_all" BOOLEAN NOT NULL DEFAULT true;

-- product_fiscal_branches: override de ISSQN por filial
ALTER TABLE "erp"."product_fiscal_branches"
  ADD COLUMN "issqn" TEXT NOT NULL DEFAULT '';

-- Grupo fiscal mínimo por organização + tributo
CREATE TABLE "erp"."fiscal_groups" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "tax_type" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "fiscal_groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fiscal_groups_organization_id_tax_type_idx"
  ON "erp"."fiscal_groups"("organization_id", "tax_type");

-- Só tributos conhecidos (defesa DB — a entidade também valida na leitura).
ALTER TABLE "erp"."fiscal_groups"
  ADD CONSTRAINT "fiscal_groups_tax_type_check"
  CHECK ("tax_type" IN ('ICMS', 'IPI', 'PIS_COFINS', 'ISSQN'));

-- Padrão fiscal da organização (um por org)
CREATE TABLE "erp"."fiscal_default_taxes" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "icms_group_id" TEXT,
  "ipi_group_id" TEXT,
  "pis_cofins_group_id" TEXT,
  "issqn_group_id" TEXT,
  "cfop" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "fiscal_default_taxes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "fiscal_default_taxes_organization_id_key"
  ON "erp"."fiscal_default_taxes"("organization_id");

-- FKs de grupo indexadas (convenção + acelera o SET NULL ao excluir um grupo).
CREATE INDEX "fiscal_default_taxes_icms_group_id_idx"
  ON "erp"."fiscal_default_taxes"("icms_group_id");
CREATE INDEX "fiscal_default_taxes_ipi_group_id_idx"
  ON "erp"."fiscal_default_taxes"("ipi_group_id");
CREATE INDEX "fiscal_default_taxes_pis_cofins_group_id_idx"
  ON "erp"."fiscal_default_taxes"("pis_cofins_group_id");
CREATE INDEX "fiscal_default_taxes_issqn_group_id_idx"
  ON "erp"."fiscal_default_taxes"("issqn_group_id");

-- FKs: grupos e padrão pertencem à organização
ALTER TABLE "erp"."fiscal_groups"
  ADD CONSTRAINT "fiscal_groups_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "erp"."organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "erp"."fiscal_default_taxes"
  ADD CONSTRAINT "fiscal_default_taxes_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "erp"."organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- FKs: padrão referencia grupo por tributo (SetNull ao excluir o grupo)
ALTER TABLE "erp"."fiscal_default_taxes"
  ADD CONSTRAINT "fiscal_default_taxes_icms_group_id_fkey"
  FOREIGN KEY ("icms_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "erp"."fiscal_default_taxes"
  ADD CONSTRAINT "fiscal_default_taxes_ipi_group_id_fkey"
  FOREIGN KEY ("ipi_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "erp"."fiscal_default_taxes"
  ADD CONSTRAINT "fiscal_default_taxes_pis_cofins_group_id_fkey"
  FOREIGN KEY ("pis_cofins_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "erp"."fiscal_default_taxes"
  ADD CONSTRAINT "fiscal_default_taxes_issqn_group_id_fkey"
  FOREIGN KEY ("issqn_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
