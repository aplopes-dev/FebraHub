-- ============================================================
-- FebraHub · Migration 46 — Receita da Loja passa a vir do Omie
--
-- Antes: fato_contas_receber (Conta Azul), categoria "Centro Conceito".
-- Agora: fato_loja_cupom (Omie PDV) — o cupom fiscal da venda no balcão.
--
-- Por quê: alinha o hub com o que a gestora da loja opera no dia a dia.
--
-- O QUE MUDA:
--   receita 2026: R$249,5 mil (CA)  ->  R$254,0 mil (Omie)
--   vendas:       1.954 lançamentos ->  12.308 cupons
--   ticket médio: R$127,70          ->  ~R$43
--   histórico:    desde jan/2024    ->  desde mar/2025 (início no Omie)
--
-- O QUE SOME (não existe em cupom fiscal — é pago na hora):
--   "Recebido" e "A receber vencido"
--
-- Cupons cancelados são sempre excluídos.
-- ============================================================

-- ---------- Receita mensal ----------
drop view if exists public.vw_loja_receita_mensal cascade;
create view public.vw_loja_receita_mensal as
select
  date_trunc('month', data_emissao)::date as mes,
  count(*)          as vendas,
  sum(valor)        as receita
from public.fato_loja_cupom
where not cancelado
  and data_emissao is not null
  and public.pode_ver('loja')
group by 1
order by 1;
grant select on public.vw_loja_receita_mensal to authenticated;

-- ---------- Receita por período (para os filtros do hub) ----------
drop view if exists public.vw_loja_receita_periodo cascade;
create view public.vw_loja_receita_periodo as
select
  data_emissao          as data,
  cupom_id,
  numero_cupom,
  valor,
  cliente_id,
  vendedor_id
from public.fato_loja_cupom
where not cancelado
  and data_emissao is not null
  and public.pode_ver('loja');
grant select on public.vw_loja_receita_periodo to authenticated;

-- ---------- KPIs do topo ----------
drop view if exists public.vw_loja_kpis cascade;
create view public.vw_loja_kpis as
select
  date_trunc('year', data_emissao)::date          as ano,
  count(*)                                        as vendas,
  round(sum(valor))                               as receita,
  round(avg(valor), 2)                            as ticket_medio,
  (select round(sum(saldo * coalesce(custo_medio,0)))
     from public.fato_loja_estoque)               as estoque_custo,
  (select count(*) from public.fato_loja_estoque
     where coalesce(estoque_minimo,0) > 0 and saldo <= estoque_minimo)
                                                  as repor,
  (select count(*) from public.fato_loja_estoque
     where coalesce(estoque_minimo,0) = 0 and coalesce(saldo,0) = 0)
                                                  as sem_movimento
from public.fato_loja_cupom
where not cancelado
  and data_emissao is not null
  and public.pode_ver('loja')
group by 1;
grant select on public.vw_loja_kpis to authenticated;

-- ---------- Receita geral (compatibilidade) ----------
drop view if exists public.vw_loja_receita cascade;
create view public.vw_loja_receita as
select
  count(*)            as vendas,
  round(sum(valor))   as receita,
  round(avg(valor),2) as ticket_medio,
  min(data_emissao)   as primeira_venda,
  max(data_emissao)   as ultima_venda
from public.fato_loja_cupom
where not cancelado
  and public.pode_ver('loja');
grant select on public.vw_loja_receita to authenticated;

notify pgrst, 'reload schema';
