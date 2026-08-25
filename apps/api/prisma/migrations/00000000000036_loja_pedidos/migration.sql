-- ====================================================================
-- FebraHub · Migration 36 — LOJA: Pedidos, Pagamentos e Fila
--
-- Fluxo: carrinho (reserva temp) → pedido → pagamento → fila →
--        preparação → pronto → retirada.
--
-- Canal de origem: CARDAPIO_DIGITAL | PDV
-- Status: AGUARDANDO_PAGAMENTO | PAGAMENTO_CONFIRMADO | NA_FILA |
--         PROXIMO | EM_PREPARACAO | PRONTO | RETIRADO | CANCELADO
--
-- Número público simples (#1001, #1002…) em vez de UUID exposto.
-- Integração Financeiro: venda gera financeiroLancamento (origem=loja).
-- Reserva de estoque: loja_estoque_saldos.reservado incrementado ao
-- iniciar checkout, decrementado quando pago ou expirado.
-- ====================================================================

-- -------------------- OPERAÇÕES / EVENTOS DA LOJA --------------------
-- Agrupa pedidos por evento/operação (ex: CIS Externo Ago/2026).
CREATE TABLE loja_operacoes (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text    NOT NULL,
  descricao    text    NOT NULL DEFAULT '',
  modo         text    NOT NULL DEFAULT 'RETIRADA_BALCAO'
                       CHECK (modo IN ('RETIRADA_BALCAO', 'SERVICO_MESA')),
  status       text    NOT NULL DEFAULT 'ativa'
                       CHECK (status IN ('ativa','encerrada','suspensa')),
  slug         text    UNIQUE,            -- p/ cardápio público /cardapio/:slug
  inicio       timestamptz,
  fim          timestamptz,
  criado_em    timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX loja_operacoes_status_idx ON loja_operacoes (status);

-- -------------------- PEDIDOS --------------------
CREATE TABLE loja_pedidos (
  id              uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  numero          int    NOT NULL,         -- número público sequencial por operação
  operacao_id     uuid   REFERENCES loja_operacoes(id) ON DELETE SET NULL,
  canal           text   NOT NULL DEFAULT 'CARDAPIO_DIGITAL'
                         CHECK (canal IN ('CARDAPIO_DIGITAL','PDV')),
  status          text   NOT NULL DEFAULT 'AGUARDANDO_PAGAMENTO'
                         CHECK (status IN (
                           'AGUARDANDO_PAGAMENTO','PAGAMENTO_CONFIRMADO',
                           'NA_FILA','PROXIMO','EM_PREPARACAO',
                           'PRONTO','RETIRADO','CANCELADO'
                         )),
  -- cliente (identificação mínima para cardápio)
  cliente_nome    text   NOT NULL DEFAULT '',
  cliente_tel     text,                    -- WhatsApp (sem formatação)
  -- operador PDV (se canal=PDV)
  operador_id     uuid,
  operador_nome   text,
  -- valores
  subtotal        numeric(14,2) NOT NULL DEFAULT 0,
  desconto        numeric(14,2) NOT NULL DEFAULT 0,
  total           numeric(14,2) NOT NULL DEFAULT 0,
  -- fila de preparação
  posicao_fila    int,
  precisa_preparacao boolean NOT NULL DEFAULT false,
  -- datas de transição
  confirmado_em   timestamptz,
  entrou_fila_em  timestamptz,
  preparacao_em   timestamptz,
  pronto_em       timestamptz,
  retirado_em     timestamptz,
  cancelado_em    timestamptz,
  motivo_cancel   text,
  -- referência financeira
  lancamento_id   uuid,
  observacoes     text NOT NULL DEFAULT '',
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);
-- Número sequencial por operação (garante unicidade por operação)
CREATE UNIQUE INDEX loja_pedidos_numero_op_uk
  ON loja_pedidos (operacao_id, numero);
CREATE INDEX loja_pedidos_status_idx
  ON loja_pedidos (status, posicao_fila);
CREATE INDEX loja_pedidos_operacao_idx
  ON loja_pedidos (operacao_id, status, criado_em DESC);
CREATE INDEX loja_pedidos_canal_idx
  ON loja_pedidos (canal, status, criado_em DESC);

-- -------------------- ITENS DO PEDIDO --------------------
CREATE TABLE loja_pedido_itens (
  id              uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid   NOT NULL REFERENCES loja_pedidos(id) ON DELETE CASCADE,
  produto_id      uuid   NOT NULL REFERENCES loja_produtos(id) ON DELETE RESTRICT,
  descricao       text   NOT NULL,
  quantidade      numeric(12,3) NOT NULL,
  preco_unit      numeric(14,2) NOT NULL,
  total           numeric(14,2) NOT NULL,
  observacao      text   NOT NULL DEFAULT ''
);
CREATE INDEX loja_pedido_itens_pedido_idx ON loja_pedido_itens (pedido_id);
CREATE INDEX loja_pedido_itens_produto_idx ON loja_pedido_itens (produto_id);

-- -------------------- PAGAMENTOS DO PEDIDO --------------------
CREATE TABLE loja_pedido_pagamentos (
  id              uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid   NOT NULL REFERENCES loja_pedidos(id) ON DELETE CASCADE,
  provider        text   NOT NULL DEFAULT 'manual'
                         CHECK (provider IN ('manual','asaas','stone','pagarme')),
  forma           text   NOT NULL,  -- PIX | CARTAO_CREDITO | CARTAO_DEBITO | DINHEIRO
  status          text   NOT NULL DEFAULT 'PENDENTE'
                         CHECK (status IN ('PENDENTE','CONFIRMADO','RECUSADO','EXPIRADO','ESTORNADO')),
  valor           numeric(14,2) NOT NULL,
  -- campos do gateway
  gateway_id      text,            -- ID da cobrança no gateway
  gateway_payload jsonb,           -- resposta bruta do gateway
  pix_qrcode      text,            -- QR Code PIX (base64 ou URL)
  pix_copia_cola  text,            -- código copia e cola
  pix_expiracao   timestamptz,
  confirmado_em   timestamptz,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX loja_pedido_pagamentos_pedido_idx ON loja_pedido_pagamentos (pedido_id);
CREATE INDEX loja_pedido_pagamentos_gateway_idx ON loja_pedido_pagamentos (gateway_id) WHERE gateway_id IS NOT NULL;

-- -------------------- AUDITORIA DE TRANSIÇÕES --------------------
CREATE TABLE loja_pedido_historico (
  id          uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   uuid   NOT NULL REFERENCES loja_pedidos(id) ON DELETE CASCADE,
  de_status   text,
  para_status text   NOT NULL,
  origem      text   NOT NULL DEFAULT 'sistema', -- sistema|operador|cliente|webhook
  usuario_id  uuid,
  observacao  text   NOT NULL DEFAULT '',
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX loja_pedido_historico_pedido_idx ON loja_pedido_historico (pedido_id, criado_em DESC);

-- -------------------- CONTADOR DE NUMERAÇÃO --------------------
-- Garante número sequencial por operação sem race condition.
CREATE TABLE loja_numeracao_pedido (
  operacao_id  uuid  PRIMARY KEY REFERENCES loja_operacoes(id) ON DELETE CASCADE,
  ultimo       int   NOT NULL DEFAULT 0
);
