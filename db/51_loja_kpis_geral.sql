-- ============================================================
-- FebraHub · Migration 51 — KPIs da Loja com linha "Geral"
--
-- A vw_loja_kpis agrupava só por ano. Agora traz também uma linha
-- com ano = NULL representando o acumulado de todo o período,
-- para o filtro "Geral" do hub.
-- ============================================================

drop view if exists public.vw_loja_kpis cascade;
create view public.vw_loja_kpis as
with base as (
  select data_emissao, valor
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
),
estoque as (
  select
    round(sum(saldo * coalesce(custo_medio,0)))    as custo,
    round(sum(saldo * coalesce(preco_unitario,0))) as venda,
    count(*) filter (where coalesce(estoque_minimo,0) > 0
                       and saldo <= estoque_minimo) as repor,
    count(*) filter (where coalesce(estoque_minimo,0) = 0
                       and coalesce(saldo,0) = 0)   as sem_movimento,
    count(*)                                        as produtos
  from public.fato_loja_estoque
)
-- por ano
select
  extract(year from b.data_emissao)::int as ano,
  count(*)                               as vendas,
  round(sum(b.valor))                    as receita,
  round(avg(b.valor), 2)                 as ticket_medio,
  e.custo                                as estoque_custo,
  e.venda                                as estoque_venda,
  e.produtos,
  e.repor,
  e.sem_movimento
from base b cross join estoque e
where public.pode_ver('loja')
group by 1, e.custo, e.venda, e.produtos, e.repor, e.sem_movimento

union all

-- acumulado (ano = null -> filtro "Geral")
select
  null::int                              as ano,
  count(*)                               as vendas,
  round(sum(b.valor))                    as receita,
  round(avg(b.valor), 2)                 as ticket_medio,
  e.custo, e.venda, e.produtos, e.repor, e.sem_movimento
from base b cross join estoque e
where public.pode_ver('loja')
group by e.custo, e.venda, e.produtos, e.repor, e.sem_movimento;

grant select on public.vw_loja_kpis to authenticated;

notify pgrst, 'reload schema';
