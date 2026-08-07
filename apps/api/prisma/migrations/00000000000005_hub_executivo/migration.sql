-- ============================================================================
-- Hub Executivo: metas por indicador e preferências de visualização
--
-- POR QUE ESTAS TABELAS EXISTEM:
-- docs/DIVIDAS.md §9 registrava "não existe tabela de metas — se o KPI de meta
-- for necessário, precisa de uma tabela, e aí ele passa a existir de verdade,
-- com histórico de quem mudou o quê e quando". É esta tabela. A única meta que
-- já existia no sistema é a da loja (fato_loja_meta_mes, vinda de planilha);
-- ela continua valendo e o catálogo de indicadores a usa como fonte da meta da
-- loja. Para todos os outros indicadores, meta só existe se alguém cadastrar
-- aqui — o painel NUNCA inventa meta, e indicador sem meta mostra "Sem meta
-- definida" em vez de um percentual fabricado.
--
-- O histórico de alteração NÃO mora aqui: cada escrita grava uma linha em
-- auditoria_acesso (acao 'meta_definida'/'meta_removida', detalhe jsonb com o
-- valor anterior e o novo). Uma tabela de versões própria duplicaria o que a
-- trilha já faz.
--
-- Idempotente: pode rodar de novo sem erro, e pode já ter sido aplicada à mão
-- (o deploy roda `prisma migrate deploy` depois).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.meta_indicador (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Código do catálogo de indicadores (apps/api/src/modules/executivo).
  -- Sem FK: o catálogo é código, não tabela. A API valida contra ele.
  indicador   text        NOT NULL,
  -- 'mes' = meta do mês da competência; 'ano' = meta do ano (competência 01/01).
  escopo      text        NOT NULL DEFAULT 'mes' CHECK (escopo IN ('mes', 'ano')),
  -- Sempre dia 1º: a meta é do período, não de um dia.
  competencia date        NOT NULL,
  valor       numeric     NOT NULL CHECK (valor >= 0),
  observacao  text,
  -- Solto, sem FK, como em auditoria_acesso: a meta sobrevive ao usuário.
  criado_por  uuid,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Uma meta por indicador+período. Redefinir é UPDATE (com trilha), não linha nova.
CREATE UNIQUE INDEX IF NOT EXISTS ux_meta_indicador_periodo
  ON public.meta_indicador (indicador, escopo, competencia);

COMMENT ON TABLE public.meta_indicador IS
  'Metas reais cadastradas pela diretoria/gestores. Sem linha aqui (e sem meta de planilha, no caso da loja), o painel mostra "Sem meta definida" — nunca um número inventado.';

-- ----------------------------------------------------------------------------
-- Preferências do Hub Executivo: ordem dos cards, ocultos, favoritos, período
-- e comparação padrão. Uma linha por usuário + a linha 'empresa' (a visão
-- padrão administrável que vale para quem nunca personalizou).
-- jsonb em vez de colunas: o conjunto de preferências muda com o painel, e
-- cada preferência nova não pode exigir migration.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.hub_preferencia (
  -- uuid do usuário em texto, ou o literal 'empresa' para a visão padrão.
  id            text        PRIMARY KEY,
  config        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.hub_preferencia IS
  'Personalização do Hub Executivo por usuário; a linha id=''empresa'' é a visão padrão administrável.';

-- ----------------------------------------------------------------------------
-- Índices que as séries diárias do hub varrem e que a migration 01 não criou.
-- (loja por dia de emissão; Meta Ads por dia sem prefixo de campanha)
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS ix_loja_cupom_emissao
  ON public.fato_loja_cupom (data_emissao);

CREATE INDEX IF NOT EXISTS ix_loja_pagamento_data
  ON public.fato_loja_pagamento (data_transacao);

CREATE INDEX IF NOT EXISTS ix_meta_insights_data
  ON public.fato_meta_insights (data);
