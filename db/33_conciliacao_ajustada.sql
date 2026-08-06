-- ============================================================
-- FebraHub · Migration 33 — Conciliação CisPay ajustada
--
-- Correções sobre a 32:
--   1) exclui status Negado/Cancelado — pagamento negado não tem
--      liquidação por definição, não é divergência
--   2) agrupa por VENDA, não por linha (vendas com várias formas
--      apareciam repetidas)
--   3) marca como 'fora_do_periodo' o que é anterior a ago/2024,
--      quando a liquidação da CisPay começa — não há como conciliar
--
-- Divergências reais (ago/2024 em diante, excluindo negados):
--   829 vendas, R$3,2 milhões
--
-- Observação de negócio: as divergências se concentram em vendas de
-- alto valor (R$40k a R$120k). Provável que sejam registradas como
-- CisPay no Salesforce mas pagas por transferência — ou seja,
-- classificação imprecisa da forma, não dinheiro faltando.
-- ============================================================

drop view if exists public.vw_financeiro_conciliacao_cispay cascade;
create view public.vw_financeiro_conciliacao_cispay as
with venda as (
  -- 1 linha por venda
  select
    original_id_venda,
    max(payment_id)             as payment_id,
    max(data_pagamento)         as data_pagamento,
    max(valor)                  as valor,
    max(nome_venda)             as nome_venda,
    max(consultor_id)           as consultor_id,
    max(tipo_matricula)         as tipo_matricula,
    max(status_pagamento)       as status_pagamento,
    string_agg(distinct forma_pagamento, ' + ') as formas
  from public.fato_pagamento_base
  where forma_pagamento ilike '%cispay%'
  group by original_id_venda
),
liq as (
  select pagamento_cartao_id,
         count(*)             as parcelas,
         sum(valor_bruto)     as bruto,
         sum(valor_liquido)   as liquido,
         sum(taxa_cispay)     as taxa,
         min(data_liquidacao) as primeira_liquidacao,
         max(data_liquidacao) as ultima_liquidacao
  from public.fato_liquidacao_cartao
  where tipo_transacao = 'Credit'
  group by pagamento_cartao_id
)
select
  v.original_id_venda,
  v.payment_id,
  v.data_pagamento,
  nullif(split_part(v.nome_venda,' - ',3),'') as cliente,
  v.nome_venda,
  v.consultor_id,
  v.tipo_matricula,
  v.status_pagamento,
  v.formas,
  round(v.valor)        as valor_salesforce,
  round(l.bruto)        as valor_cispay,
  round(l.liquido)      as liquido_cispay,
  round(l.taxa)         as taxa_cispay,
  l.parcelas,
  l.primeira_liquidacao,
  l.ultima_liquidacao,
  case
    when coalesce(v.status_pagamento,'') in ('Negado','Cancelado') then 'nao_aplicavel'
    when v.payment_id is null or v.payment_id = ''                 then 'sem_payment_id'
    when l.pagamento_cartao_id is not null                         then 'conciliado'
    when v.data_pagamento < '2024-08-01'                           then 'fora_do_periodo'
    else 'divergencia'
  end                   as situacao,
  'https://febracis.lightning.force.com/lightning/r/Opportunity/'
    || v.original_id_venda || '/view' as link_salesforce
from venda v
left join liq l on l.pagamento_cartao_id = v.payment_id
where public.pode_ver('financeiro');

grant select on public.vw_financeiro_conciliacao_cispay to authenticated;

-- Resumo por mês e situação
drop view if exists public.vw_financeiro_conciliacao_resumo cascade;
create view public.vw_financeiro_conciliacao_resumo as
select
  date_trunc('month', data_pagamento)::date as mes,
  situacao,
  count(*)                                  as vendas,
  round(sum(valor_salesforce))              as valor
from public.vw_financeiro_conciliacao_cispay
group by 1,2
order by 1 desc, 4 desc;

grant select on public.vw_financeiro_conciliacao_resumo to authenticated;

notify pgrst, 'reload schema';
