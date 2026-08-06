-- ============================================================
-- FebraHub · Migration 58 — Série histórica unificada da loja
--
-- FATURAMENTO, por período:
--   2022 a 2024  -> planilha de fechamento (fato_loja_fechamento)
--                   é a única fonte do período; o Omie só existe
--                   a partir de mar/2025
--   2025 em diante -> consolidado atual (Omie + livrão + cursos
--                   premium + aluguel + Sentido de Brincar)
--
-- METAS: sempre da planilha de fechamento (2022 a 2026). Substitui
-- as metas da outra planilha, que divergiam (jan/2026 aparecia como
-- R$200 mil lá e R$50 mil aqui — o certo é R$50 mil).
--
-- Abril/2023 não existe na planilha (não preencheram) e fica sem dado.
-- ============================================================

drop view if exists public.vw_loja_serie cascade;
create view public.vw_loja_serie as
with historico as (
  -- 2022-2024: planilha de fechamento
  select
    mes_ref                as mes,
    extract(year from mes_ref)::int as ano,
    faturamento            as receita,
    'Planilha de fechamento'::text as fonte
  from public.fato_loja_fechamento
  where mes_ref < '2025-01-01'
    and faturamento is not null
),
atual as (
  -- 2025 em diante: consolidado (Omie + demais fontes)
  select
    mes                    as mes,
    extract(year from mes)::int as ano,
    sum(valor)::numeric    as receita,
    'Omie + fontes'::text  as fonte
  from public.vw_loja_receita_consolidada
  group by 1
),
serie as (
  select * from historico
  union all
  select * from atual
)
select
  s.mes, s.ano, round(s.receita) as receita, s.fonte,
  f.meta_minima, f.meta_basica, f.meta_master,
  case when coalesce(f.meta_minima,0) > 0
       then round(100.0 * s.receita / f.meta_minima, 1) end as pct_minima,
  case
    when coalesce(f.meta_minima,0)=0 and coalesce(f.meta_basica,0)=0
     and coalesce(f.meta_master,0)=0                              then 'Sem meta'
    when coalesce(f.meta_master,0) > 0 and s.receita >= f.meta_master then 'Máster'
    when coalesce(f.meta_basica,0) > 0 and s.receita >= f.meta_basica then 'Básica'
    when coalesce(f.meta_minima,0) > 0 and s.receita >= f.meta_minima then 'Mínima'
    else 'Abaixo'
  end as nivel_atingido,
  round(case
    when coalesce(f.meta_master,0) > 0 and s.receita >= f.meta_master then null
    when coalesce(f.meta_basica,0) > 0 and s.receita >= f.meta_basica then f.meta_master - s.receita
    when coalesce(f.meta_minima,0) > 0 and s.receita >= f.meta_minima then f.meta_basica - s.receita
    else f.meta_minima - s.receita
  end) as falta_proximo,
  (s.mes = date_trunc('month', current_date)::date) as em_curso
from serie s
left join public.fato_loja_fechamento f on f.mes_ref = s.mes
where public.pode_ver('loja')
order by s.mes;

grant select on public.vw_loja_serie to authenticated;

-- KPIs por ano + linha "Geral" (ano null), agora sobre a série completa
drop view if exists public.vw_loja_kpis_ano cascade;
create view public.vw_loja_kpis_ano as
select ano, round(sum(receita)) as receita, count(*) as meses
from public.vw_loja_serie
group by ano
union all
select null::int, round(sum(receita)), count(*)
from public.vw_loja_serie;
grant select on public.vw_loja_kpis_ano to authenticated;

notify pgrst, 'reload schema';
