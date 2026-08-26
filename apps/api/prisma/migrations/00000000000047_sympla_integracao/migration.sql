-- ====================================================================
-- FebraHub · Migration 47 — SYMPLA INTEGRAÇÃO
--
-- Tabelas para sincronização da API Sympla:
--   sympla_eventos   — lista de eventos da conta
--   sympla_orders    — pedidos (orders) por evento
--   sympla_participantes — participantes de cada order
--   sympla_sync_log  — controle de sincronização (idempotência)
--
-- Token: variável de ambiente SYMPLA_TOKEN
-- Base URL: https://api.sympla.com.br/public/v3
-- Auth header: s_token: <token>
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.sympla_eventos (
  id              BIGINT      PRIMARY KEY,  -- ID nativo Sympla
  nome            TEXT        NOT NULL,
  data_inicio     TIMESTAMPTZ,
  data_fim        TIMESTAMPTZ,
  local_nome      TEXT,
  cidade          TEXT,
  estado          TEXT,
  imagem_url      TEXT,
  url_sympla      TEXT,
  publicado       BOOLEAN     NOT NULL DEFAULT true,
  cancelado       BOOLEAN     NOT NULL DEFAULT false,
  total_pedidos   INTEGER,    -- qty de orders (atualizado no sync)
  total_receita   NUMERIC(14,2) DEFAULT 0,  -- soma order_total_sale_price
  total_liquido   NUMERIC(14,2) DEFAULT 0,  -- soma order_total_net_value
  payload_raw     JSONB,      -- resposta completa da API para auditoria
  sincronizado_em TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sy_evento_data   ON public.sympla_eventos (data_inicio DESC);
CREATE INDEX IF NOT EXISTS ix_sy_evento_estado ON public.sympla_eventos (estado);

CREATE TABLE IF NOT EXISTS public.sympla_orders (
  id              TEXT        PRIMARY KEY,  -- order ID da Sympla (ex: "2LLQZ8DJDR3")
  evento_id       BIGINT      NOT NULL REFERENCES public.sympla_eventos(id) ON DELETE CASCADE,
  order_date      TIMESTAMPTZ,
  approved_date   TIMESTAMPTZ,
  updated_date    TIMESTAMPTZ,
  -- 'A' = aprovado, 'C' = cancelado, 'P' = pendente, etc.
  status          TEXT,
  -- FREE | PIX | CREDIT_CARD | BOLETO | etc.
  transaction_type TEXT,
  total_sale_price NUMERIC(14,2) DEFAULT 0,
  total_net_value  NUMERIC(14,2) DEFAULT 0,
  -- Comprador
  buyer_first_name TEXT,
  buyer_last_name  TEXT,
  buyer_email      TEXT,
  -- CPF (extraído de invoice_info)
  buyer_cpf        TEXT,
  -- UTM
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  utm_term         TEXT,
  utm_content      TEXT,
  referrer         TEXT,
  -- Vínculo com Pessoa do CRM (deduplicação)
  crm_cliente_id   UUID        REFERENCES public.crm_clientes(id) ON DELETE SET NULL,
  -- Oportunidade gerada
  com_oportunidade_id UUID     REFERENCES public.com_oportunidades(id) ON DELETE SET NULL,
  payload_raw      JSONB,
  sincronizado_em  TIMESTAMPTZ,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sy_order_evento   ON public.sympla_orders (evento_id);
CREATE INDEX IF NOT EXISTS ix_sy_order_status   ON public.sympla_orders (status);
CREATE INDEX IF NOT EXISTS ix_sy_order_email    ON public.sympla_orders (buyer_email);
CREATE INDEX IF NOT EXISTS ix_sy_order_cpf      ON public.sympla_orders (buyer_cpf) WHERE buyer_cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_sy_order_crm      ON public.sympla_orders (crm_cliente_id) WHERE crm_cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_sy_order_data     ON public.sympla_orders (order_date DESC);

CREATE TABLE IF NOT EXISTS public.sympla_participantes (
  id              BIGINT      PRIMARY KEY,  -- participant ID nativo Sympla
  order_id        TEXT        NOT NULL REFERENCES public.sympla_orders(id) ON DELETE CASCADE,
  evento_id       BIGINT      NOT NULL REFERENCES public.sympla_eventos(id) ON DELETE CASCADE,
  ticket_number   TEXT,
  ticket_name     TEXT,
  ticket_price    NUMERIC(14,2) DEFAULT 0,
  first_name      TEXT,
  last_name       TEXT,
  email           TEXT,
  telefone        TEXT,       -- extraído do custom_form
  cpf             TEXT,       -- extraído do custom_form
  checkin         BOOLEAN     NOT NULL DEFAULT false,
  checkin_date    TIMESTAMPTZ,
  -- Campos extras do formulário customizado
  custom_form     JSONB       DEFAULT '[]',
  -- Vínculo com CRM
  crm_cliente_id  UUID        REFERENCES public.crm_clientes(id) ON DELETE SET NULL,
  payload_raw     JSONB,
  sincronizado_em TIMESTAMPTZ,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_sy_part_order    ON public.sympla_participantes (order_id);
CREATE INDEX IF NOT EXISTS ix_sy_part_evento   ON public.sympla_participantes (evento_id);
CREATE INDEX IF NOT EXISTS ix_sy_part_email    ON public.sympla_participantes (email);
CREATE INDEX IF NOT EXISTS ix_sy_part_cpf      ON public.sympla_participantes (cpf) WHERE cpf IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_sy_part_crm      ON public.sympla_participantes (crm_cliente_id) WHERE crm_cliente_id IS NOT NULL;

-- Log de sincronização para controle de jobs e idempotência
CREATE TABLE IF NOT EXISTS public.sympla_sync_log (
  id              BIGSERIAL   PRIMARY KEY,
  -- eventos | orders_evento | participantes_order | full
  tipo            TEXT        NOT NULL,
  referencia_id   TEXT,       -- evento_id ou order_id sincronizado
  -- iniciado | concluido | erro
  status          TEXT        NOT NULL DEFAULT 'iniciado',
  total_registros INTEGER     DEFAULT 0,
  novos           INTEGER     DEFAULT 0,
  atualizados     INTEGER     DEFAULT 0,
  erros           INTEGER     DEFAULT 0,
  erro_mensagem   TEXT,
  iniciado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluido_em    TIMESTAMPTZ,
  usuario_id      UUID        -- quem disparou (null = cron)
);

CREATE INDEX IF NOT EXISTS ix_sy_sync_tipo   ON public.sympla_sync_log (tipo, iniciado_em DESC);
CREATE INDEX IF NOT EXISTS ix_sy_sync_status ON public.sympla_sync_log (status);

COMMENT ON TABLE public.sympla_eventos IS 'Cache dos eventos Sympla da conta FEBRACIS. Atualizado via sync manual ou cron.';
COMMENT ON TABLE public.sympla_orders IS 'Pedidos (vendas) da Sympla. order_total_sale_price = valor cobrado do comprador.';
COMMENT ON TABLE public.sympla_participantes IS 'Participantes confirmados. CPF e telefone extraídos do custom_form para deduplicação com CRM.';
