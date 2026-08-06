-- ============================================================
-- FebraHub · Migration 59 — KPIs da loja por dia
--
-- Os filtros "7 dias" e "Hoje" mostravam o acumulado do ano porque
-- as views só agregavam por mês e por ano. Esta view dá a
-- granularidade diária que faltava.
--
-- Só produtos (Omie/PDV), que é a única fonte com data exata de venda.
-- As demais (livrão, cursos premium, aluguel) são mensais e não fazem
-- sentido em recorte diário.
-- ============================================================

drop view if exists public.vw_loja_kpis_dia cascade;
create view public.vw_loja_kpis_dia as
select
  data_emissao              as dia,
  count(*)                  as vendas,
  round(sum(valor))         as receita,
  round(avg(valor), 2)      as ticket_medio
from public.fato_loja_cupom
where not cancelado
  and data_emissao is not null
  and public.pode_ver('loja')
group by 1
order by 1;
grant select on public.vw_loja_kpis_dia to authenticated;

-- Atalhos prontos para os filtros do topo
drop view if exists public.vw_loja_kpis_periodo cascade;
create view public.vw_loja_kpis_periodo as
with base as (
  select data_emissao as dia, valor
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
)
select 'hoje'::text as periodo,
       count(*) as vendas, round(sum(valor)) as receita,
       round(avg(valor),2) as ticket_medio
from base where dia = current_date
union all
select '7dias',
       count(*), round(sum(valor)), round(avg(valor),2)
from base where dia > current_date - 7
union all
select '30dias',
       count(*), round(sum(valor)), round(avg(valor),2)
from base where dia > current_date - 30;
grant select on public.vw_loja_kpis_periodo to authenticated;

notify pgrst, 'reload schema';
