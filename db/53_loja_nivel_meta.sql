-- ============================================================
-- FebraHub · Migration 53 — Nível de meta explícito e robusto
--
-- Problemas corrigidos:
--   1) quando a meta era superada (ex.: 125%), o nível vinha vazio
--      no card — comparação com valor nulo devolvia NULL e o CASE
--      caía fora de todos os ramos
--   2) faltava um nível intermediário claro entre "bateu" e "abaixo"
--
-- Escala de 4 níveis (do melhor para o pior):
--   Máster   -> receita >= meta máster
--   Básica   -> receita >= meta básica
--   Mínima   -> receita >= meta mínima
--   Abaixo   -> receita < meta mínima
--   (sem meta cadastrada -> 'Sem meta')
--
-- Também expõe 'faltou' (quanto falta para a mínima) e 'excedente'
-- (quanto passou da máster), para o card mostrar contexto.
-- ============================================================

drop view if exists public.vw_loja_kpis_mes cascade;
create view public.vw_loja_kpis_mes as
with base as (
  select date_trunc('month', data_emissao)::date as mes, valor
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
),
agg as (
  select
    b.mes,
    count(*)               as vendas,
    sum(b.valor)           as receita,
    round(avg(b.valor), 2) as ticket_medio,
    m.minima, m.basica, m.master
  from base b
  left join public.fato_loja_meta_mes m on m.mes_ref = b.mes
  group by b.mes, m.minima, m.basica, m.master
)
select
  mes,
  extract(year  from mes)::int as ano,
  extract(month from mes)::int as mes_num,
  vendas,
  round(receita)              as receita,
  ticket_medio,
  minima                      as meta_minima,
  basica                      as meta_basica,
  master                      as meta_master,
  case when coalesce(minima,0) > 0
       then round(100.0 * receita / minima, 1) end as pct_minima,
  case when coalesce(basica,0) > 0
       then round(100.0 * receita / basica, 1) end as pct_basica,
  case when coalesce(master,0) > 0
       then round(100.0 * receita / master, 1) end as pct_master,
  -- nível robusto a nulos: só compara o que existe
  case
    when coalesce(minima,0) = 0 and coalesce(basica,0) = 0
     and coalesce(master,0) = 0                       then 'Sem meta'
    when coalesce(master,0) > 0 and receita >= master then 'Máster'
    when coalesce(basica,0) > 0 and receita >= basica then 'Básica'
    when coalesce(minima,0) > 0 and receita >= minima then 'Mínima'
    else 'Abaixo'
  end                         as nivel_atingido,
  -- contexto para o card
  case when coalesce(minima,0) > 0 and receita < minima
       then round(minima - receita) end               as faltou_para_minima,
  case when coalesce(master,0) > 0 and receita > master
       then round(receita - master) end               as excedeu_master,
  (mes = date_trunc('month', current_date)::date)     as em_curso
from agg
where public.pode_ver('loja')
order by mes;

grant select on public.vw_loja_kpis_mes to authenticated;

notify pgrst, 'reload schema';
