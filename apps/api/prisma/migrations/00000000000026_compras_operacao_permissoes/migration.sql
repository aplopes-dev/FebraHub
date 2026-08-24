CREATE TABLE "compra_solicitacoes" (
  "id" UUID PRIMARY KEY, "protocolo" TEXT NOT NULL UNIQUE, "titulo" TEXT NOT NULL,
  "justificativa" TEXT NOT NULL, "setor" TEXT NOT NULL, "prioridade" TEXT NOT NULL DEFAULT 'normal',
  "situacao" TEXT NOT NULL DEFAULT 'rascunho', "solicitante_id" UUID NOT NULL, "responsavel_id" UUID,
  "aprovador_id" UUID, "decisao" TEXT, "motivo_decisao" TEXT, "observacoes" TEXT,
  "pedido_numero" TEXT, "previsao_entrega" DATE, "recebido_em" TIMESTAMPTZ, "encerrado_em" TIMESTAMPTZ,
  "revisao" INTEGER NOT NULL DEFAULT 1, "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT compra_prioridade_check CHECK (prioridade IN ('baixa','normal','alta','urgente')),
  CONSTRAINT compra_situacao_check CHECK (situacao IN ('rascunho','enviada','devolvida','recusada','verificacao_estoque','atendida_estoque','aguardando_prioridade','em_cotacao','aguardando_aprovacao','aprovada','pedido_emitido','aguardando_entrega','recebimento','divergencia','entrada_estoque','pronto_entrega','entregue','encerrada','cancelada'))
);
CREATE INDEX compra_solicitacoes_situacao_criado_idx ON compra_solicitacoes(situacao, criado_em DESC);
CREATE INDEX compra_solicitacoes_setor_criado_idx ON compra_solicitacoes(setor, criado_em DESC);

CREATE TABLE "compra_itens" (
  "id" UUID PRIMARY KEY, "solicitacao_id" UUID NOT NULL REFERENCES compra_solicitacoes(id) ON DELETE CASCADE,
  "descricao" TEXT NOT NULL, "quantidade" DECIMAL(12,3) NOT NULL, "unidade" TEXT NOT NULL,
  "valor_estimado" DECIMAL(14,2), "estoque_disponivel" DECIMAL(12,3), "quantidade_reservada" DECIMAL(12,3) NOT NULL DEFAULT 0,
  "situacao" TEXT NOT NULL DEFAULT 'pendente', "especificacao" TEXT
);
CREATE INDEX compra_itens_solicitacao_idx ON compra_itens(solicitacao_id);

CREATE TABLE "compra_cotacoes" (
  "id" UUID PRIMARY KEY, "solicitacao_id" UUID NOT NULL REFERENCES compra_solicitacoes(id) ON DELETE CASCADE,
  "fornecedor" TEXT NOT NULL, "documento" TEXT, "valor_total" DECIMAL(14,2) NOT NULL, "prazo_dias" INTEGER,
  "condicao_pagamento" TEXT, "observacoes" TEXT, "escolhida" BOOLEAN NOT NULL DEFAULT false,
  "criada_por" UUID NOT NULL, "criada_em" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX compra_cotacoes_solicitacao_idx ON compra_cotacoes(solicitacao_id);

CREATE TABLE "compra_historico" (
  "id" UUID PRIMARY KEY, "solicitacao_id" UUID NOT NULL REFERENCES compra_solicitacoes(id) ON DELETE CASCADE,
  "usuario_id" UUID NOT NULL, "acao" TEXT NOT NULL, "situacao_anterior" TEXT, "situacao_nova" TEXT,
  "comentario" TEXT, "dados" JSONB NOT NULL DEFAULT '{}', "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX compra_historico_solicitacao_criado_idx ON compra_historico(solicitacao_id, criado_em DESC);

-- Pares canônicos lidos pelo teste que mantém migration e perfis em sincronia.
WITH adicoes(slug, permissao) AS (VALUES
  ('diretoria','compras.ver'),('diretoria','compras.solicitar'),('diretoria','compras.operar'),('diretoria','compras.aprovar'),
  ('gestor','compras.ver'),('gestor','compras.solicitar'),('gestor','compras.operar'),('gestor','compras.aprovar'),
  ('equipe','compras.ver'),('equipe','compras.solicitar')
), agrupadas AS (SELECT slug,array_agg(permissao) permissoes FROM adicoes GROUP BY slug)
UPDATE perfis_acesso p SET permissoes=ARRAY(SELECT DISTINCT unnest(p.permissoes||a.permissoes)) FROM agrupadas a WHERE p.slug=a.slug;
UPDATE perfis_acesso SET permissoes=ARRAY(SELECT DISTINCT unnest(permissoes||ARRAY['compras.ver','compras.solicitar','compras.operar','compras.aprovar'])) WHERE slug='admin';
