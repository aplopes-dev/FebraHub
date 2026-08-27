-- ====================================================================
-- FebraHub · Migration 53 — OMIE: configuração, SKU e lançamentos
--
-- Objetivo: integração bidirecional FebraHub ↔ Omie para a Loja.
--   1. omie_config        — chaves de API e configurações (linha única id='omie')
--   2. loja_produtos.sku_omie — código do produto no Omie (sincronizado pelo SKU)
--   3. omie_lancamentos   — registro de cada pedido lançado no Omie
--
-- Regra de SKU:
--   - Se o produto já existe no Omie (buscado por codigo_interno ou codigo),
--     grava o codigo_interno do Omie em sku_omie do loja_produto.
--   - Se não existe, o sistema cria o produto no Omie e popula sku_omie.
--   - sku_omie também é sincronizado de volta ao campo `codigo` do Omie.
-- ====================================================================

-- 1. Configuração da integração Omie (linha única: id='omie')
CREATE TABLE IF NOT EXISTS public.omie_config (
  id              TEXT        PRIMARY KEY DEFAULT 'omie',
  app_key         TEXT,                         -- app_key da API Omie
  app_secret      TEXT,                         -- app_secret da API Omie (cifrado)
  conta_corrente  TEXT,                         -- id da conta corrente padrão para lançamentos
  codigo_categoria TEXT,                        -- código da categoria financeira padrão
  id_vendedor     BIGINT,                       -- id do vendedor padrão no Omie
  ativo           BOOLEAN     NOT NULL DEFAULT false,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.omie_config IS 'Configuração da integração Omie. Linha única (id=omie). app_secret deve ser cifrado antes de gravar.';

-- 2. Adiciona sku_omie em loja_produtos (código interno do produto no Omie)
ALTER TABLE public.loja_produtos
  ADD COLUMN IF NOT EXISTS sku_omie TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS loja_produtos_sku_omie_idx
  ON public.loja_produtos (sku_omie)
  WHERE sku_omie IS NOT NULL;

COMMENT ON COLUMN public.loja_produtos.sku_omie IS
  'Código interno do produto no Omie (campo codigo_interno). Sincronizado bidirecionalmente. NULL = ainda não mapeado.';

-- 3. Tabela de lançamentos Omie (um registro por pedido lançado)
CREATE TABLE IF NOT EXISTS public.omie_lancamentos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id         UUID        NOT NULL REFERENCES public.loja_pedidos(id) ON DELETE RESTRICT,
  -- id do pedido/OS no Omie (numero_pedido retornado pela API)
  omie_pedido_id    BIGINT,
  -- número do pedido no Omie
  omie_numero       TEXT,
  -- status do lançamento local: pendente | lancado | erro | cancelado
  status            TEXT        NOT NULL DEFAULT 'pendente',
  -- payload de erro (se houver)
  erro              TEXT,
  -- id do usuário que lançou manualmente (null = automático)
  usuario_id        UUID        REFERENCES public.usuarios(id) ON DELETE SET NULL,
  usuario_nome      TEXT,
  -- data em que foi lançado com sucesso no Omie
  lancado_em        TIMESTAMPTZ,
  -- snapshot do payload enviado ao Omie (para auditoria/reenvio)
  payload_enviado   JSONB,
  -- resposta completa do Omie
  resposta_omie     JSONB,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS omie_lancamentos_pedido_idx  ON public.omie_lancamentos (pedido_id);
CREATE INDEX IF NOT EXISTS omie_lancamentos_status_idx  ON public.omie_lancamentos (status);
CREATE INDEX IF NOT EXISTS omie_lancamentos_criado_idx  ON public.omie_lancamentos (criado_em DESC);

COMMENT ON TABLE public.omie_lancamentos IS
  'Registro de cada pedido da Loja lançado no Omie. Um pedido pode ter no máximo 1 lançamento ativo.';

-- Índice parcial: garante 1 lançamento não-cancelado por pedido
CREATE UNIQUE INDEX IF NOT EXISTS omie_lancamentos_pedido_unico_idx
  ON public.omie_lancamentos (pedido_id)
  WHERE status <> 'cancelado';
