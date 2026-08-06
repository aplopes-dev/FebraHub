-- ============================================================
-- FebraHub · Migration 32 — Conciliação CisPay × Salesforce
--
-- O vínculo é o Payment Id (UUID), presente nos dois lados:
--   Salesforce: fato_pagamento_base.payment_id
--   CisPay:     fato_liquidacao_cartao.pagamento_cartao_id
--
-- MDR efetivo medido: 3,00% uniforme, sem variação relevante por
-- bandeira ou parcelamento.
--
-- Automatiza a conferência que hoje é feita à mão: abrir o pagamento
-- no Salesforce, copiar o Payment Id, buscar na CisPay e confirmar.
-- ============================================================

-- ------------------------------------------------------------
-- 1. CONCILIAÇÃO — pagamento a pagamento, com e sem liquidação
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_conciliacao_cispay cascade;
create view public.vw_financeiro_conciliacao_cispay as
select
  p.pagamento_id,
  p.payment_id,
  p.original_id_venda,
  p.data_pagamento,
  p.nome_venda,
  p.consultor_id,
  p.tipo_matricula,
  p.status_pagamento,
  p.forma_pagamento,
  p.valor                                   as valor_salesforce,
  l.bruto                                   as valor_cispay,
  l.liquido                                 as liquido_cispay,
  l.taxa                                    as taxa_cispay,
  l.parcelas,
  l.primeira_liquidacao,
  l.ultima_liquidacao,
  case
    when p.payment_id is null or p.payment_id = '' then 'sem_payment_id'
    when l.pagamento_cartao_id is null             then 'sem_liquidacao'
    else 'conciliado'
  end                                       as situacao,
  'https://febracis.lightning.force.com/lightning/r/Opportunity/'
    || p.original_id_venda || '/view'        as link_salesforce
from public.fato_pagamento_base p
left join (
  select pagamento_cartao_id,
         count(*)                  as parcelas,
         sum(valor_bruto)          as bruto,
         sum(valor_liquido)        as liquido,
         sum(taxa_cispay)          as taxa,
         min(data_liquidacao)      as primeira_liquidacao,
         max(data_liquidacao)      as ultima_liquidacao
  from public.fato_liquidacao_cartao
  where tipo_transacao = 'Credit'
  group by pagamento_cartao_id
) l on l.pagamento_cartao_id = p.payment_id
where p.forma_pagamento ilike '%cispay%'
  and public.pode_ver('financeiro');

grant select on public.vw_financeiro_conciliacao_cispay to authenticated;

-- ------------------------------------------------------------
-- 2. RESUMO DA CONCILIAÇÃO — para o card do hub
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_conciliacao_resumo cascade;
create view public.vw_financeiro_conciliacao_resumo as
select
  date_trunc('month', data_pagamento)::date  as mes,
  situacao,
  count(*)                                   as pagamentos,
  round(sum(valor_salesforce))               as valor
from public.vw_financeiro_conciliacao_cispay
group by 1,2
order by 1 desc, 3 desc;

grant select on public.vw_financeiro_conciliacao_resumo to authenticated;

-- ------------------------------------------------------------
-- 3. TAXA REAL POR CURSO — substitui a antiga liquido_por_curso,
--    que dependia do vínculo quebrado desde julho/2025
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_taxa_por_curso cascade;
create view public.vw_financeiro_taxa_por_curso as
select
  f.categoria_curso                             as categoria,
  coalesce(f.curso_curto, f.curso)              as curso,
  date_trunc('month', l.data_venda)::date       as mes,
  count(*)                                      as parcelas,
  round(sum(l.valor_bruto))                     as bruto,
  round(sum(l.valor_liquido))                   as liquido,
  round(sum(l.taxa_cispay))                     as taxa,
  round(100.0 * sum(l.taxa_cispay)
        / nullif(sum(l.valor_bruto),0), 2)      as mdr_pct
from public.fato_liquidacao_cartao l
join public.fato_pagamento_base p  on p.payment_id = l.pagamento_cartao_id
join public.vw_venda_faturamento f on f.original_id_venda = p.original_id_venda
where l.tipo_transacao = 'Credit'
  and l.data_venda is not null
  and public.pode_ver('financeiro')
group by 1,2,3;

grant select on public.vw_financeiro_taxa_por_curso to authenticated;

notify pgrst, 'reload schema';
