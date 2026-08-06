-- ============================================================
-- FebraHub · Migration 44 — Produtos vendidos por mês (Loja/Omie)
--
-- A vw_loja_produtos_vendidos é um agregado de todos os tempos, sem
-- coluna de data — o bloco "Mais vendidos" não conseguia responder ao
-- filtro de período do hub.
--
-- Esta view acrescenta o mês (da data de emissão do cupom), permitindo
-- o front filtrar e somar o período selecionado.
--
-- Mantém as mesmas regras: exclui cupons e itens cancelados, e abate a
-- quantidade devolvida.
-- ============================================================

drop view if exists public.vw_loja_produtos_vendidos_mes cascade;
create view public.vw_loja_produtos_vendidos_mes as
select
  date_trunc('month', c.data_emissao)::date as mes,
  i.produto_id,
  max(i.descricao)                          as produto,
  round(sum(i.quantidade - coalesce(i.quantidade_dev,0)), 2) as quantidade,
  round(sum(i.valor_item))                  as faturamento,
  count(distinct i.cupom_id)                as cupons
from public.fato_loja_item i
join public.fato_loja_cupom c on c.cupom_id = i.cupom_id
where not i.cancelado
  and not c.cancelado
  and c.data_emissao is not null
group by 1,2;

grant select on public.vw_loja_produtos_vendidos_mes to authenticated;

notify pgrst, 'reload schema';
