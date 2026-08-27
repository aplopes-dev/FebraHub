-- Central de Vendas e Conciliação (FebraHub + Stone + Omie).
-- VendaConsolidada = evento comercial real. VendaOrigem = registro de cada
-- sistema, ligado (ou não) a uma consolidada. Conciliação é relação, nunca fusão.

CREATE TABLE "vendas_consolidadas" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "numero" SERIAL NOT NULL,
  "unidade" TEXT,
  "evento_id" UUID,
  "evento_nome" TEXT,
  "cliente_nome" TEXT,
  "cliente_doc" TEXT,
  "data_venda" TIMESTAMPTZ(6) NOT NULL,
  "forma_pagamento" TEXT,
  "valor_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "valor_recebido" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "valor_liquido" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "valor_estornado" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "status_conciliacao" TEXT NOT NULL DEFAULT 'REQUER_REVISAO',
  "inferido" BOOLEAN NOT NULL DEFAULT false,
  "observacao" TEXT NOT NULL DEFAULT '',
  "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "vendas_consolidadas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendas_consolidadas_status_data_idx"
  ON "vendas_consolidadas" ("status_conciliacao", "data_venda" DESC);
CREATE INDEX "vendas_consolidadas_data_idx"
  ON "vendas_consolidadas" ("data_venda" DESC);
CREATE INDEX "vendas_consolidadas_unidade_idx"
  ON "vendas_consolidadas" ("unidade");
CREATE INDEX "vendas_consolidadas_valor_idx"
  ON "vendas_consolidadas" ("valor_total");

CREATE TABLE "vendas_origens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "consolidada_id" UUID,
  "origem" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "loja_pedido_id" UUID,
  "stone_transacao_id" UUID,
  "omie_lancamento_id" UUID,
  "valor" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "data_hora" TIMESTAMPTZ(6),
  "nsu" TEXT,
  "tid" TEXT,
  "autorizacao" TEXT,
  "bandeira" TEXT,
  "forma_pagamento" TEXT,
  "parcelas" INTEGER,
  "terminal" TEXT,
  "unidade" TEXT,
  "cliente_nome" TEXT,
  "cliente_doc" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OK',
  "payload" JSONB,
  "vinculo_modo" TEXT,
  "vinculo_score" INTEGER,
  "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "vendas_origens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vendas_origens_consolidada_fkey"
    FOREIGN KEY ("consolidada_id") REFERENCES "vendas_consolidadas"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "vendas_origens_origem_external_key"
  ON "vendas_origens" ("origem", "external_id");
CREATE INDEX "vendas_origens_consolidada_idx" ON "vendas_origens" ("consolidada_id");
CREATE INDEX "vendas_origens_origem_status_idx" ON "vendas_origens" ("origem", "status");
CREATE INDEX "vendas_origens_nsu_idx" ON "vendas_origens" ("nsu");
CREATE INDEX "vendas_origens_tid_idx" ON "vendas_origens" ("tid");
CREATE INDEX "vendas_origens_valor_idx" ON "vendas_origens" ("valor");
CREATE INDEX "vendas_origens_data_idx" ON "vendas_origens" ("data_hora" DESC);

CREATE TABLE "conciliacao_auditoria" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "consolidada_id" UUID,
  "origem_id" UUID,
  "acao" TEXT NOT NULL,
  "detalhe" TEXT NOT NULL DEFAULT '',
  "valor_antes" JSONB,
  "valor_depois" JSONB,
  "usuario_id" UUID,
  "usuario_nome" TEXT,
  "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "conciliacao_auditoria_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "conciliacao_auditoria_consolidada_idx"
  ON "conciliacao_auditoria" ("consolidada_id", "criado_em" DESC);
CREATE INDEX "conciliacao_auditoria_acao_idx"
  ON "conciliacao_auditoria" ("acao", "criado_em" DESC);
