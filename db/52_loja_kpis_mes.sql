-- ============================================================
-- FebraHub · Migration 52 — KPIs da Loja por mês
--
-- A vw_loja_kpis só agregava por ano (e o acumulado geral), então ao
-- filtrar um mês o card de receita continuava mostrando o ano inteiro.
--
-- Agora existe a vw_loja_kpis_mes, com uma linha por mês, e a
-- vw_loja_kpis segue servindo ao filtro de ano/geral.
-- ============================================================

drop view if exists public.vw_loja_kpis_mes cascade;
create view public.vw_loja_kpis_mes as
with base as (
  select
    date_trunc('month', data_emissao)::date as mes,
    valor
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
)
select
  b.mes,
  extract(year  from b.mes)::int  as ano,
  extract(month from b.mes)::int  as mes_num,
  count(*)                        as vendas,
  round(sum(b.valor))             as receita,
  round(avg(b.valor), 2)          as ticket_medio,
  m.minima                        as meta_minima,
  m.basica                        as meta_basica,
  m.master                        as meta_master,
  case when m.minima > 0
       then round(100.0 * sum(b.valor) / m.minima, 1) end as pct_minima,
  case
    when m.master is null and m.basica is null and m.minima is null then null
    when sum(b.valor) >= m.master then 'Máster'
    when sum(b.valor) >= m.basica then 'Básica'
    when sum(b.valor) >= m.minima then 'Mínima'
    else 'Abaixo'
  end                             as nivel_atingido,
  -- mês ainda em curso: a comparação com a meta cheia não é justa
  (b.mes = date_trunc('month', current_date)::date) as em_curso
from base b
left join public.fato_loja_meta_mes m on m.mes_ref = b.mes
where public.pode_ver('loja')
group by b.mes, m.minima, m.basica, m.master
order by b.mes;

grant select on public.vw_loja_kpis_mes to authenticated;

notify pgrst, 'reload schema';
