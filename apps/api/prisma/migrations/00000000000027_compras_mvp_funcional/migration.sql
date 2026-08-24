ALTER TABLE compra_solicitacoes
  ADD COLUMN tipo text NOT NULL DEFAULT 'material',
  ADD COLUMN unidade text,
  ADD COLUMN centro_custo text,
  ADD COLUMN projeto text,
  ADD COLUMN data_necessaria date,
  ADD COLUMN anexos jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE compra_itens
  ADD COLUMN produto_id bigint,
  ADD COLUMN finalidade text,
  ADD COLUMN fornecedor_sugerido text,
  ADD COLUMN anexos jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN quantidade_recebida numeric(12,3) NOT NULL DEFAULT 0;

ALTER TABLE compra_cotacoes
  ADD COLUMN cnpj text,
  ADD COLUMN contato text,
  ADD COLUMN valor_unitario numeric(14,2),
  ADD COLUMN frete numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN desconto numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN validade_proposta date,
  ADD COLUMN garantia text,
  ADD COLUMN criterio_escolha text,
  ADD COLUMN justificativa_escolha text,
  ADD COLUMN escolhida_por uuid,
  ADD COLUMN escolhida_em timestamptz;

CREATE TABLE compra_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), solicitacao_id uuid NOT NULL REFERENCES compra_solicitacoes(id) ON DELETE CASCADE,
  cotacao_id uuid, numero text NOT NULL UNIQUE, fornecedor text NOT NULL, valor_total numeric(14,2) NOT NULL,
  condicao_pagamento text, previsao_entrega date, enviado_em timestamptz, cancelado_em timestamptz,
  motivo_cancelamento text, criado_por uuid NOT NULL, criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX compra_pedidos_solicitacao_id_idx ON compra_pedidos(solicitacao_id);

CREATE TABLE compra_recebimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), solicitacao_id uuid NOT NULL REFERENCES compra_solicitacoes(id) ON DELETE CASCADE,
  pedido_id uuid REFERENCES compra_pedidos(id) ON DELETE SET NULL, nota_fiscal text, observacoes text, divergencia text,
  anexos jsonb NOT NULL DEFAULT '[]'::jsonb, itens jsonb NOT NULL, recebido_por uuid NOT NULL, criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX compra_recebimentos_solicitacao_criado_idx ON compra_recebimentos(solicitacao_id, criado_em DESC);

CREATE TABLE compra_movimentos_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), solicitacao_id uuid NOT NULL, item_id uuid NOT NULL, produto_id bigint NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('reserva','saida','entrada')), quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  usuario_id uuid NOT NULL, criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX compra_movimentos_estoque_solicitacao_criado_idx ON compra_movimentos_estoque(solicitacao_id, criado_em DESC);

UPDATE compra_solicitacoes SET situacao = 'encerrada' WHERE situacao = 'encerrada';
