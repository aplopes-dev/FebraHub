-- ====================================================================
-- FebraHub · Migration 37 — LOJA: Auditoria de eventos críticos (PRD §48)
--
-- Registro imutável de QUEM fez O QUÊ, QUANDO e sobre QUAL entidade, com o
-- estado anterior e posterior quando relevante. Cobre: alteração de preço,
-- ajuste de estoque, cancelamento, pagamento, estorno, retirada, alteração
-- manual de pedido, alteração de configuração e webhooks.
--
-- Genérico de propósito (entidade + entidade_id) para não criar uma tabela de
-- auditoria por recurso. Consultado por entidade ou por período.
-- ====================================================================

CREATE TABLE loja_auditoria (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade      text    NOT NULL,          -- pedido | produto | operacao | pagamento | estoque | config
  entidade_id   uuid,                      -- id do alvo (quando aplicável)
  acao          text    NOT NULL,          -- preco.alterado | estoque.ajustado | pedido.cancelado | pagamento.confirmado | pedido.estornado | pedido.retirado | config.alterada | webhook.recebido ...
  origem        text    NOT NULL DEFAULT 'sistema',  -- operador | cliente | sistema | webhook
  usuario_id    uuid,
  usuario_nome  text,
  antes         jsonb,                     -- estado anterior (quando relevante)
  depois        jsonb,                     -- estado posterior
  observacao    text    NOT NULL DEFAULT '',
  criado_em     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX loja_auditoria_entidade_idx ON loja_auditoria (entidade, entidade_id, criado_em DESC);
CREATE INDEX loja_auditoria_acao_idx     ON loja_auditoria (acao, criado_em DESC);
CREATE INDEX loja_auditoria_data_idx     ON loja_auditoria (criado_em DESC);
