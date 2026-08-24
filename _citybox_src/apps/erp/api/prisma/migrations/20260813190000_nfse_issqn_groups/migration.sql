-- Emissão de NFS-e com Grupos de ISSQN (spec erp/018)
-- (1) situação de ISSQN em fiscal_groups (perfil fiscal do serviço, NFS-e)
-- (2) issqn_group_id em product_fiscals / product_fiscal_branches (FK do serviço)
-- (3) nfse_issuances: vínculo documento fiscal (fiscal-api) ↔ operação do ERP
-- ⚠️ DB erp (citybox_platform) não provisionado neste ambiente — migration
--    versionada, aplicada via `prisma migrate deploy` no ambiente correto.

-- (1) fiscal_groups: situação de ISSQN (usada quando tax_type = ISSQN)
ALTER TABLE "erp"."fiscal_groups"
  ADD COLUMN "issqn_service_code" TEXT,
  ADD COLUMN "issqn_national_code" TEXT,
  ADD COLUMN "issqn_rate" DECIMAL(7,4),
  ADD COLUMN "issqn_trib_type" TEXT;

-- Defesa em nível de banco (a entidade também valida) — mesmo padrão do
-- fiscal_groups_tax_type_check. tribISSQN só 1/2/4 nesta fatia (3 exportação
-- exige dados extras; NULL permitido para grupos de outros tributos).
ALTER TABLE "erp"."fiscal_groups"
  ADD CONSTRAINT "fiscal_groups_issqn_trib_type_check"
  CHECK ("issqn_trib_type" IS NULL OR "issqn_trib_type" IN ('1', '2', '4'));

-- (2) product_fiscals: FK do grupo de ISSQN
ALTER TABLE "erp"."product_fiscals"
  ADD COLUMN "issqn_group_id" TEXT;
CREATE INDEX "product_fiscals_issqn_group_id_idx"
  ON "erp"."product_fiscals"("issqn_group_id");
ALTER TABLE "erp"."product_fiscals"
  ADD CONSTRAINT "product_fiscals_issqn_group_id_fkey"
  FOREIGN KEY ("issqn_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- product_fiscal_branches: override do grupo de ISSQN por unidade
ALTER TABLE "erp"."product_fiscal_branches"
  ADD COLUMN "issqn_group_id" TEXT;
CREATE INDEX "product_fiscal_branches_issqn_group_id_idx"
  ON "erp"."product_fiscal_branches"("issqn_group_id");
ALTER TABLE "erp"."product_fiscal_branches"
  ADD CONSTRAINT "product_fiscal_branches_issqn_group_id_fkey"
  FOREIGN KEY ("issqn_group_id") REFERENCES "erp"."fiscal_groups"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- (3) nfse_issuances: vínculo documento fiscal ↔ operação do ERP
CREATE TABLE "erp"."nfse_issuances" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "company_id" TEXT NOT NULL,
  "source_system" TEXT NOT NULL,
  "external_reference" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "access_key" TEXT,
  "protocol" TEXT,
  "status" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "nfse_issuances_pkey" PRIMARY KEY ("id")
);

-- Idempotência local por organização: a mesma operação não emite duas notas.
-- Nome curto explícito: o default (83 chars) estouraria o limite de 63 bytes do
-- Postgres, que truncaria em silêncio e divergiria do schema (drift).
CREATE UNIQUE INDEX "nfse_issuances_idempotency_key"
  ON "erp"."nfse_issuances"("organization_id", "source_system", "external_reference", "idempotency_key");
CREATE INDEX "nfse_issuances_organization_id_company_id_idx"
  ON "erp"."nfse_issuances"("organization_id", "company_id");
-- Ordenação da listagem (org + created_at desc, id desc) sem sort não indexado.
CREATE INDEX "nfse_issuances_organization_id_created_at_id_idx"
  ON "erp"."nfse_issuances"("organization_id", "created_at" DESC, "id" DESC);

ALTER TABLE "erp"."nfse_issuances"
  ADD CONSTRAINT "nfse_issuances_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "erp"."organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
