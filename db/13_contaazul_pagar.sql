-- ============================================================
-- FebraHub · Migration 13 — Conta Azul: Contas a PAGAR (despesas)
--
-- REGRA DE RECEITA (confirmada com o negócio):
--   Toda venda passa pelo Salesforce (o Ney aprova). A Conta Azul
--   só registra o RECEBIMENTO por transferência. Logo:
--     - Receita  -> SEMPRE Salesforce (nunca somar Conta Azul, dobra)
--     - Caixa    -> CisPay (cartão) + Conta Azul (transferência)
--     - Loja     -> exceção: Centro Conceito NÃO passa no Salesforce,
--                   é receita exclusiva da Conta Azul (não duplica)
--   Portanto contas a pagar aqui são DESPESA pura, sem sobreposição.
--
-- NÃO criamos view de "caixa líquido" ingênuo (receber-pagar da
-- Conta Azul): o "a receber" da Conta Azul é parcial (só transf.),
-- então o líquido daria rombo falso. Caixa líquido consolidado é
-- projeto do Hub Executivo, cruzando todas as fontes com cuidado.
-- ============================================================

begin;

create table if not exists public.fato_contas_pagar (
  parcela_id         text primary key,
  evento_id          text,
  descricao          text,
  fornecedor         text,
  data_vencimento    date,
  data_competencia   date,
  data_pagamento     date,
  status             text,
  valor              numeric(12,2),
  valor_pago         numeric(12,2),
  categoria          text,
  centro_custo       text,
  sincronizado_em    timestamptz default now()
);

alter table public.fato_contas_pagar enable row level security;

create index if not exists ix_cp_vencimento on public.fato_contas_pagar (data_vencimento);
create index if not exists ix_cp_pagamento  on public.fato_contas_pagar (data_pagamento);
create index if not exists ix_cp_status     on public.fato_contas_pagar (status);

commit;

-- Remove a view enganosa se foi criada numa execução anterior
drop view if exists public.vw_financeiro_caixa_liquido cascade;


-- ============================================================
-- DESPESAS — "para onde vai o dinheiro" (sem sobreposição)
-- ============================================================

-- Por categoria. O prefixo "(-)" já vem do plano de contas da Febracis.
create or replace view public.vw_financeiro_despesa_categoria as
select
  coalesce(categoria, 'Sem categoria') as categoria,
  count(*)                             as parcelas,
  sum(valor)                           as total,
  sum(valor) filter (where data_pagamento is not null) as pago,
  sum(valor) filter (where data_pagamento is null)     as em_aberto
from public.fato_contas_pagar
where public.pode_ver('financeiro')
group by 1
order by 3 desc;

-- A pagar por horizonte (o que a empresa ainda deve, quando vence)
create or replace view public.vw_financeiro_a_pagar_horizonte as
select
  case
    when data_vencimento <= current_date + 30 then '1 · até 30 dias'
    when data_vencimento <= current_date + 60 then '2 · 31 a 60 dias'
    when data_vencimento <= current_date + 90 then '3 · 61 a 90 dias'
    else '4 · além de 90 dias'
  end                        as horizonte,
  count(*)                   as parcelas,
  sum(valor)                 as a_pagar
from public.fato_contas_pagar
where public.pode_ver('financeiro')
  and data_pagamento is null
  and data_vencimento > current_date
group by 1 order by 1;

-- Despesa efetivamente paga por mês
create or replace view public.vw_financeiro_pago_mensal as
select
  date_trunc('month', data_pagamento)::date as mes,
  count(*)                                   as parcelas,
  sum(coalesce(valor_pago, valor))           as pago
from public.fato_contas_pagar
where public.pode_ver('financeiro')
  and data_pagamento is not null
group by 1 order by 1;

grant select on
  public.vw_financeiro_despesa_categoria,
  public.vw_financeiro_a_pagar_horizonte,
  public.vw_financeiro_pago_mensal
to authenticated;
