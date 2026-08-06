-- ============================================================
-- FebraHub · Migration 11 — Hub Loja (via Conta Azul)
--
-- Descoberta: "Centro Conceito" na Conta Azul É a Loja da Febracis.
-- A Conta Azul tem a receita COMPLETA da loja:
--   - "Centro Conceito - conta bancária" = cartão/PIX (~R$ 2,6M)
--   - "Centro Conceito - caixa"          = dinheiro   (~R$ 178k)
--
-- Isto NÃO se soma à receita de cursos (Salesforce) — é outra
-- unidade de negócio (loja de produtos), receita própria.
--
-- O Omie (estoque + produtos vendidos) entra depois e enriquece;
-- por enquanto o Hub Loja mostra o lado FINANCEIRO, que já é real.
-- ============================================================

-- Receita total da loja + split por forma de recebimento
create or replace view public.vw_loja_receita as
select
  case
    when categoria ilike '%conta bancária%' or categoria ilike '%conta bancaria%'
      then 'Cartão/PIX'
    when categoria ilike '%caixa%'
      then 'Dinheiro'
    else 'Outros'
  end                                as forma,
  count(*)                           as vendas,
  sum(valor)                         as receita,
  sum(valor) filter (where data_pagamento is not null) as recebido
from public.fato_contas_receber
where public.pode_ver('loja')
  and categoria ilike '%centro conceito%'
group by 1
order by 3 desc;

-- Evolução mensal da receita da loja
create or replace view public.vw_loja_receita_mensal as
select
  date_trunc('month', coalesce(data_pagamento, data_vencimento))::date as mes,
  count(*)   as vendas,
  sum(valor) as receita
from public.fato_contas_receber
where public.pode_ver('loja')
  and categoria ilike '%centro conceito%'
group by 1
order by 1;

-- KPIs consolidados (total, ticket médio, nº de vendas)
create or replace view public.vw_loja_kpis as
select
  count(*)                              as vendas,
  sum(valor)                            as receita_total,
  round(avg(valor), 2)                  as ticket_medio,
  sum(valor) filter (where data_pagamento is not null) as recebido,
  sum(valor) filter (where status = 'Vencido')         as a_receber_vencido
from public.fato_contas_receber
where public.pode_ver('loja')
  and categoria ilike '%centro conceito%';

grant select on
  public.vw_loja_receita,
  public.vw_loja_receita_mensal,
  public.vw_loja_kpis
to authenticated;

-- Teste (rode sem o pode_ver no editor, RLS bloqueia service_role):
-- select * from public.vw_loja_receita;
