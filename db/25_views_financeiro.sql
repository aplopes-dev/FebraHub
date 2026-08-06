-- ============================================================
-- FebraHub · Migration 25 — Views do Financeiro corrigidas
--
-- PROBLEMAS CORRIGIDOS:
--  1) Somavam p.valor por linha do fato_pagamento_base, que tem 1 linha
--     por FORMA DE PAGAMENTO -> venda contada N vezes.
--  2) Faziam LEFT JOIN fato_base_alunos sem deduplicar -> vendas que
--     geram várias matrículas (comprador + consumidores) contadas de novo.
--  3) Ignoravam COMPRADOR DE VAGAS (R$11,4M de receita fora da conta).
--  4) Aplicavam split só no Coaching Individual, sem as regras do
--     CIS Global (20/50/80 por faixa) e das mentorias TCB/TCL (50%).
--  5) vw_financeiro_receita não filtrava tipo_matricula: somava Bônus,
--     Cortesia etc. como receita.
--
-- SOLUÇÃO: todas passam a ler de vw_venda_faturamento (migration 24),
-- que já entrega 1 linha por venda com valor_bruto, pct_unidade e valor.
--
-- NÃO MUDAM (corretas, 1 linha = 1 parcela real):
--   a_receber/a_pagar_horizonte, caixa_*, despesa_*, inadimplencia*,
--   mdr, pago_mensal, perdas_cartao, recebido_mensal.
-- ============================================================

-- ------------------------------------------------------------
-- RECEITA GERAL (curso + evento)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita cascade;
create view public.vw_financeiro_receita as
select
  date_trunc('month', f.data_pagamento)::date        as mes,
  coalesce(p.unidade_geradora_venda,'nao_informado') as unidade,
  'curso'::text                                      as tipo_receita,
  p.status_pagamento,
  p.forma_pagamento,
  count(*)                                           as transacoes,
  sum(f.valor_bruto)                                 as valor_bruto,
  sum(f.valor)                                       as valor_liquido
from public.vw_venda_faturamento f
join lateral (
  select unidade_geradora_venda, status_pagamento, forma_pagamento
  from public.fato_pagamento_base
  where original_id_venda = f.original_id_venda
  limit 1
) p on true
where public.pode_ver('financeiro')
group by 1,2,3,4,5
union all
select
  date_trunc('month', e.data_pedido)::date as mes,
  'eventos'::text                          as unidade,
  'evento'::text                           as tipo_receita,
  e.status_pedido                          as status_pagamento,
  e.forma_pagamento,
  count(*)                                 as transacoes,
  sum(e.valor_total)                       as valor_bruto,
  sum(e.valor_liquido)                     as valor_liquido
from public.fato_pedidos e
where public.pode_ver('financeiro')
group by 1,2,3,4,5;

grant select on public.vw_financeiro_receita to authenticated;

-- ------------------------------------------------------------
-- RECEITA POR CATEGORIA (mensal)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_categoria cascade;
create view public.vw_financeiro_receita_categoria as
select
  f.categoria_curso                          as categoria,
  date_trunc('month', f.data_pagamento)::date as mes,
  count(*)                                   as vendas,
  sum(f.valor_bruto)                         as receita_bruta,
  sum(f.valor)                               as receita_unidade,
  sum(f.valor_bruto - f.valor)               as repasse
from public.vw_venda_faturamento f
where public.pode_ver('financeiro')
group by 1,2;

grant select on public.vw_financeiro_receita_categoria to authenticated;

-- ------------------------------------------------------------
-- RECEITA POR CATEGORIA (com data, para filtro de período)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_categoria_periodo cascade;
create view public.vw_financeiro_receita_categoria_periodo as
select
  f.categoria_curso                          as categoria,
  date_trunc('month', f.data_pagamento)::date as mes,
  f.data_pagamento                           as data,
  count(*)                                   as vendas,
  sum(f.valor_bruto)                         as receita_bruta,
  sum(f.valor)                               as receita_unidade,
  sum(f.valor_bruto - f.valor)               as repasse
from public.vw_venda_faturamento f
where public.pode_ver('financeiro')
group by 1,2,3;

grant select on public.vw_financeiro_receita_categoria_periodo to authenticated;

-- ------------------------------------------------------------
-- RECEITA POR CATEGORIA (total acumulado, sem Bônus)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_categoria_total cascade;
create view public.vw_financeiro_receita_categoria_total as
select
  f.categoria_curso              as categoria,
  count(*)                       as vendas,
  sum(f.valor_bruto)             as receita_bruta,
  sum(f.valor)                   as receita_unidade,
  sum(f.valor_bruto - f.valor)   as repasse
from public.vw_venda_faturamento f
where f.categoria_curso <> 'Bônus'
  and public.pode_ver('financeiro')
group by 1
order by 4 desc;

grant select on public.vw_financeiro_receita_categoria_total to authenticated;

-- ------------------------------------------------------------
-- RECEITA MENSAL
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_mensal cascade;
create view public.vw_financeiro_receita_mensal as
select
  date_trunc('month', f.data_pagamento)::date as mes,
  sum(f.valor)                                as receita,
  sum(f.valor_bruto)                          as receita_bruta
from public.vw_venda_faturamento f
where public.pode_ver('financeiro')
group by 1
order by 1;

grant select on public.vw_financeiro_receita_mensal to authenticated;

-- ------------------------------------------------------------
-- FORMAS DE PAGAMENTO
-- Vendas com forma única recebem o valor da venda. Vendas pagas em
-- mais de uma forma vão para "Múltiplas formas": o dado não permite
-- saber quanto foi em cada uma (o valor total se repete nas linhas e
-- o valor_parcela não reconstrói o total quando há juros).
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_formas_pagamento cascade;
create view public.vw_financeiro_formas_pagamento as
with formas_da_venda as (
  select original_id_venda,
         count(distinct forma_pagamento) as n_formas,
         min(forma_pagamento)            as forma_unica
  from public.fato_pagamento_base
  group by original_id_venda
)
select
  case
    when fv.n_formas > 1 then 'Múltiplas formas'
    when fv.forma_unica ilike '%cispay%' or fv.forma_unica ilike '%cielo%' then 'Cartão/PIX CisPay'
    when fv.forma_unica ilike '%boleto%'    then 'Boleto'
    when fv.forma_unica ilike '%transfer%'  then 'Transferência'
    when fv.forma_unica ilike '%dinheiro%'  then 'Dinheiro'
    when fv.forma_unica ilike '%credito de curso%' or fv.forma_unica ilike '%credito em curso%'
      or fv.forma_unica ilike '%pontos%'    then 'Crédito/Bônus interno'
    when fv.forma_unica ilike '%getnet%' or fv.forma_unica ilike '%rede%'
      or fv.forma_unica ilike '%stone%'  or fv.forma_unica ilike '%pagseguro%'
                                            then 'Adquirente legada'
    else 'Outras'
  end                       as forma,
  count(*)                  as vendas,
  round(sum(f.valor))       as receita
from public.vw_venda_faturamento f
join formas_da_venda fv on fv.original_id_venda = f.original_id_venda
where public.pode_ver('financeiro')
group by 1
order by 3 desc;

grant select on public.vw_financeiro_formas_pagamento to authenticated;

-- ------------------------------------------------------------
-- LÍQUIDO POR CURSO (liquidação de cartão)
-- O join com pagamento multiplicava cada liquidação pelo número de
-- formas da venda. Passa a usar vw_venda_faturamento (1 por venda).
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_liquido_por_curso cascade;
create view public.vw_financeiro_liquido_por_curso as
select
  date_trunc('month', l.data_venda)::date  as mes,
  coalesce(f.curso,'nao_determinado')      as curso,
  count(*)                                 as parcelas,
  sum(l.valor_bruto)                       as bruto,
  sum(l.valor_liquido)                     as liquido,
  sum(l.taxa_cispay)                       as taxa_cartao
from public.fato_liquidacao_cartao l
left join public.vw_venda_faturamento f on f.original_id_venda = l.cod_salesforce
where public.pode_ver('financeiro')
  and l.tipo_transacao = 'Credit'
  and l.data_venda is not null
group by 1,2;

grant select on public.vw_financeiro_liquido_por_curso to authenticated;

-- ------------------------------------------------------------
-- QUALIDADE — passa a medir por venda, não por linha
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_qualidade cascade;
create view public.vw_financeiro_qualidade as
select
  count(*)                                                   as total,
  count(*) filter (where data_pagamento is null)             as sem_data,
  sum(valor) filter (where data_pagamento is null)           as valor_sem_data,
  count(*) filter (where status_pagamento is null)           as sem_status,
  round(100.0 * count(*) filter (where status_pagamento is null)
        / nullif(count(*),0), 1)                             as pct_sem_status
from (
  select original_id_venda,
         max(data_pagamento)   as data_pagamento,
         max(valor)            as valor,
         max(status_pagamento) as status_pagamento
  from public.fato_pagamento_base
  group by original_id_venda
) v
where public.pode_ver('financeiro');

grant select on public.vw_financeiro_qualidade to authenticated;
