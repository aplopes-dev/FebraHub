-- ============================================================
-- FebraHub · Migration 10 — Conta Azul (contas a receber)
--
-- Duas coisas:
-- 1. Tabela de tokens OAuth2 — a Conta Azul v2 ROTACIONA o refresh
--    token a cada renovação (o antigo morre). O script precisa ler o
--    token atual, renovar, e gravar o novo aqui. Sem isso, funciona
--    uma vez e quebra na seguinte — era o que obrigava o Postman.
-- 2. Tabela de fato de contas a receber.
-- ============================================================

begin;

-- ---- Tokens OAuth2 (uma linha por integração) ----
create table if not exists public.integracao_tokens (
  integracao      text primary key,          -- 'contaazul'
  access_token    text,
  refresh_token   text not null,             -- ROTACIONA — sempre salvar o novo
  expira_em       timestamptz,
  atualizado_em   timestamptz default now()
);

alter table public.integracao_tokens enable row level security;
-- Sem policy: nem anon nem usuário logado lê tokens. Só service_role
-- (o ETL) acessa, e a service_role ignora RLS por definição.

-- ---- Contas a receber (parcelas) ----
create table if not exists public.fato_contas_receber (
  parcela_id            text primary key,
  evento_id             text,
  descricao             text,
  cliente               text,

  data_vencimento       date,
  data_competencia      date,
  data_pagamento        date,       -- null = ainda não recebido
  status                text,       -- pendente / recebido / atrasado / etc.

  valor                 numeric(12,2),
  valor_pago            numeric(12,2),

  categoria             text,
  conta_financeira      text,
  centro_custo          text,

  sincronizado_em       timestamptz default now()
);

alter table public.fato_contas_receber enable row level security;

create index if not exists ix_cr_vencimento on public.fato_contas_receber (data_vencimento);
create index if not exists ix_cr_pagamento  on public.fato_contas_receber (data_pagamento);
create index if not exists ix_cr_status     on public.fato_contas_receber (status);

commit;


-- ============================================================
-- FLUXO DE CAIXA — CONTAS A RECEBER
-- Finalmente o "caixa recebido" completo: não só cartão (CisPay),
-- mas TUDO que a Febracis tem a receber, de qualquer forma.
-- ============================================================

-- A receber por horizonte (o que ainda vai entrar)
create or replace view public.vw_financeiro_a_receber_horizonte as
select
  case
    when data_vencimento <= current_date + 30 then '1 · até 30 dias'
    when data_vencimento <= current_date + 60 then '2 · 31 a 60 dias'
    when data_vencimento <= current_date + 90 then '3 · 61 a 90 dias'
    else '4 · além de 90 dias'
  end                        as horizonte,
  count(*)                   as parcelas,
  sum(valor)                 as a_receber
from public.fato_contas_receber
where public.pode_ver('financeiro')
  and data_pagamento is null            -- ainda não recebido
  and data_vencimento > current_date
group by 1 order by 1;

-- Recebido por mês (caixa que efetivamente entrou)
create or replace view public.vw_financeiro_recebido_mensal as
select
  date_trunc('month', data_pagamento)::date as mes,
  count(*)                                   as parcelas,
  sum(coalesce(valor_pago, valor))           as recebido
from public.fato_contas_receber
where public.pode_ver('financeiro')
  and data_pagamento is not null
group by 1 order by 1;

-- Inadimplência REAL — agora dá, porque há data de vencimento.
-- Vencido e não pago = inadimplente. Isto o Salesforce não tinha.
create or replace view public.vw_financeiro_inadimplencia as
select
  date_trunc('month', data_vencimento)::date as mes,
  count(*)                                    as vencidas,
  sum(valor)                                  as valor_vencido
from public.fato_contas_receber
where public.pode_ver('financeiro')
  and data_pagamento is null
  and data_vencimento < current_date
group by 1 order by 1;

grant select on
  public.vw_financeiro_a_receber_horizonte,
  public.vw_financeiro_recebido_mensal,
  public.vw_financeiro_inadimplencia
to authenticated;
