-- Informações adicionais da nota fiscal (spec erp/017)
-- Nova tabela: texto fixo que o emissor concatena por (documentType, target) e
-- injeta no XML transmitido (NF-e/NFC-e infAdic/infCpl|infAdFisco; NFS-e
-- serv/infoCompl/xInfComp — só INF_CPL, plan D10).
-- ⚠️ DB erp (citybox_platform) não provisionado neste ambiente — migration
--    versionada, aplicada via `prisma migrate deploy` no ambiente correto.

CREATE TABLE "erp"."fiscal_additional_infos" (
  "id" TEXT NOT NULL,
  "organization_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "document_type" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "fiscal_additional_infos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "fiscal_additional_infos_organization_id_document_type_idx"
  ON "erp"."fiscal_additional_infos"("organization_id", "document_type");

ALTER TABLE "erp"."fiscal_additional_infos"
  ADD CONSTRAINT "fiscal_additional_infos_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "erp"."organizations"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Defesa em nível de banco (a entidade também valida na leitura) — mesmo padrão
-- do `fiscal_groups_tax_type_check`. `document_type`/`target` são enums fechados,
-- e a NFS-e nacional NÃO tem `infAdFisco` (plan D10): o par NFSE+INF_AD_FISCO é
-- proibido no XSD, então também é recusado aqui.
ALTER TABLE "erp"."fiscal_additional_infos"
  ADD CONSTRAINT "fiscal_additional_infos_document_type_check"
  CHECK ("document_type" IN ('NFE', 'NFCE', 'NFSE'));
ALTER TABLE "erp"."fiscal_additional_infos"
  ADD CONSTRAINT "fiscal_additional_infos_target_check"
  CHECK ("target" IN ('INF_CPL', 'INF_AD_FISCO'));
ALTER TABLE "erp"."fiscal_additional_infos"
  ADD CONSTRAINT "fiscal_additional_infos_nfse_no_fisco_check"
  CHECK (NOT ("document_type" = 'NFSE' AND "target" = 'INF_AD_FISCO'));
