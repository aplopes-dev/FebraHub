-- ============================================================
-- FebraHub · Migration 47 — Corrige KPIs da Loja
--
-- Problema: a 46 devolvia 'ano' como DATE (2026-01-01) e o front
-- filtra por ano como INTEIRO (2026) -> não casava, KPIs zerados.
--
-- Agora expõe ano como integer e também uma linha "todos os anos".
-- ============================================================

drop view if exists public.vw_loja_kpis cascade;
create view public.vw_loja_kpis as
select
  extract(year from data_emissao)::int   as ano,
  count(*)                               as vendas,
  round(sum(valor))                      as receita,
  round(avg(valor), 2)                   as ticket_medio,
  (select round(sum(saldo * coalesce(custo_medio,0)))
     from public.fato_loja_estoque)      as estoque_custo,
  (select round(sum(saldo * coalesce(preco_unitario,0)))
     from public.fato_loja_estoque)      as estoque_venda,
  (select count(*) from public.fato_loja_estoque
     where coalesce(estoque_minimo,0) > 0 and saldo <= estoque_minimo) as repor,
  (select count(*) from public.fato_loja_estoque
     where coalesce(estoque_minimo,0) = 0 and coalesce(saldo,0) = 0)   as sem_movimento
from public.fato_loja_cupom
where not cancelado
  and data_emissao is not null
  and public.pode_ver('loja')
group by 1
order by 1;

grant select on public.vw_loja_kpis to authenticated;

notify pgrst, 'reload schema';
