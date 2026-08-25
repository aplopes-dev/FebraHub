-- ====================================================================
-- FebraHub · Migration 39 — FISCAL: cupom fiscal (NFC-e mod 65 via SVRS) e
-- cupom nao fiscal (recibo interno).
--
-- Portado/adaptado do @citybox/fiscal-api. A Febracis e o UNICO emitente,
-- entao FiscalConfig e um singleton (linha id=1). Certificado A1 e token do
-- CSC ficam cifrados (AES-256-GCM); o PFX cru mora no MinIO.
-- ====================================================================

CREATE TABLE "fiscal_config" (
  "id"                  INTEGER NOT NULL DEFAULT 1,
  "ambiente"            TEXT NOT NULL DEFAULT 'homologacao',
  "razao_social"        TEXT NOT NULL,
  "nome_fantasia"       TEXT,
  "cnpj"                TEXT NOT NULL,
  "inscricao_estadual"  TEXT,
  "inscricao_municipal" TEXT,
  "regime_tributario"   TEXT NOT NULL DEFAULT '3',
  "endereco"            JSONB,
  "uf"                  TEXT NOT NULL DEFAULT 'BA',
  "codigo_municipio"    TEXT,
  "telefone"            TEXT,
  "csc_id"              TEXT,
  "csc_token_cifrado"   TEXT,
  "serie_nfce"          INTEGER NOT NULL DEFAULT 1,
  "nfce_habilitada"     BOOLEAN NOT NULL DEFAULT false,
  "atualizado_em"       TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "fiscal_config_pkey" PRIMARY KEY ("id"),
  -- garante o singleton: so a linha id=1 pode existir
  CONSTRAINT "fiscal_config_singleton" CHECK ("id" = 1)
);

CREATE TABLE "fiscal_certificados" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "nome"           TEXT NOT NULL DEFAULT '',
  "cnpj_titular"   TEXT NOT NULL,
  "pfx_object_key" TEXT NOT NULL,
  "senha_cifrada"  TEXT NOT NULL,
  "valido_de"      TIMESTAMPTZ(6) NOT NULL,
  "valido_ate"     TIMESTAMPTZ(6) NOT NULL,
  "situacao"       TEXT NOT NULL DEFAULT 'ativo',
  "criado_em"      TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "fiscal_certificados_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fiscal_certificados_situacao_valido_ate_idx" ON "fiscal_certificados" ("situacao", "valido_ate");

CREATE TABLE "fiscal_sequencias" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "tipo_documento" TEXT NOT NULL,
  "serie"          INTEGER NOT NULL,
  "ambiente"       TEXT NOT NULL,
  "numero_atual"   BIGINT NOT NULL DEFAULT 0,
  "ativo"          BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "fiscal_sequencias_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fiscal_sequencias_tipo_serie_ambiente_key" ON "fiscal_sequencias" ("tipo_documento", "serie", "ambiente");

CREATE TABLE "fiscal_documentos" (
  "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
  "tipo_documento"   TEXT NOT NULL,
  "ambiente"         TEXT NOT NULL,
  "situacao"         TEXT NOT NULL DEFAULT 'rascunho',
  "venda_id"         UUID,
  "serie"            INTEGER,
  "numero"           BIGINT,
  "chave_acesso"     TEXT,
  "protocolo"        TEXT,
  "qr_code"          TEXT,
  "valor_total"      DECIMAL(14,2) NOT NULL DEFAULT 0,
  "cliente_nome"     TEXT,
  "cliente_doc"      TEXT,
  "xml_object_key"   TEXT,
  "pdf_object_key"   TEXT,
  "codigo_erro"      TEXT,
  "mensagem_erro"    TEXT,
  "emitido_por_id"   UUID,
  "emitido_por_nome" TEXT,
  "autorizado_em"    TIMESTAMPTZ(6),
  "cancelado_em"     TIMESTAMPTZ(6),
  "criado_em"        TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "atualizado_em"    TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "fiscal_documentos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fiscal_documentos_tipo_situacao_criado_idx" ON "fiscal_documentos" ("tipo_documento", "situacao", "criado_em" DESC);
CREATE INDEX "fiscal_documentos_venda_idx" ON "fiscal_documentos" ("venda_id");
CREATE INDEX "fiscal_documentos_chave_idx" ON "fiscal_documentos" ("chave_acesso");

CREATE TABLE "fiscal_eventos" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "documento_id"  UUID,
  "tipo"          TEXT NOT NULL,
  "operacao"      TEXT NOT NULL DEFAULT '',
  "situacao"      TEXT NOT NULL DEFAULT '',
  "justificativa" TEXT,
  "protocolo"     TEXT,
  "request_xml"   TEXT,
  "response_xml"  TEXT,
  "criado_em"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "fiscal_eventos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fiscal_eventos_documento_criado_idx" ON "fiscal_eventos" ("documento_id", "criado_em" DESC);

-- ====================================================================
-- Permissoes dos perfis padrao para o modulo Fiscal (aditivo, idempotente).
-- diretoria/gestor: emitir + gerenciar. equipe: emitir. admin: tudo.
-- ====================================================================
WITH adicoes(slug, permissao) AS (VALUES
  ('diretoria', 'fiscal.emitir'),
  ('diretoria', 'fiscal.gerenciar'),
  ('gestor', 'fiscal.emitir'),
  ('gestor', 'fiscal.gerenciar'),
  ('equipe', 'fiscal.emitir')
), agrupadas AS (
  SELECT slug, array_agg(permissao) AS permissoes FROM adicoes GROUP BY slug
)
UPDATE perfis_acesso p
SET permissoes = ARRAY(SELECT DISTINCT unnest(p.permissoes || a.permissoes))
FROM agrupadas a
WHERE p.slug = a.slug;

UPDATE perfis_acesso
SET permissoes = ARRAY(SELECT DISTINCT unnest(permissoes || ARRAY[
  'fiscal.emitir','fiscal.gerenciar'
]))
WHERE slug = 'admin';
