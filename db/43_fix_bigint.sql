-- ============================================================
-- FebraHub · Migration 43 — IDs do Omie para bigint
--
-- Os IDs do Omie (cliente, vendedor, produto) passam de 2 bilhões,
-- estourando o tipo integer. Precisam ser bigint.
-- As views dependem das colunas, então derruba e recria.
-- ============================================================

drop view if exists public.vw_loja_produtos_vendidos cascade;
drop view if exists public.vw_loja_estoque cascade;

alter table public.fato_loja_cupom   alter column cliente_id  type bigint;
alter table public.fato_loja_cupom   alter column vendedor_id type bigint;
alter table public.fato_loja_item    alter column produto_id  type bigint;
alter table public.fato_loja_estoque alter column produto_id  type bigint;

-- recria as views (idênticas à migration 42)
create view public.vw_loja_produtos_vendidos as
select
  i.produto_id,
  max(i.descricao)                      as produto,
  round(sum(i.quantidade - coalesce(i.quantidade_dev,0)), 2) as quantidade,
  round(sum(i.valor_item))              as faturamento
from public.fato_loja_item i
join public.fato_loja_cupom c on c.cupom_id = i.cupom_id
where not i.cancelado and not c.cancelado
group by 1 order by 4 desc;
grant select on public.vw_loja_produtos_vendidos to authenticated;

create view public.vw_loja_estoque as
select
  produto_id, codigo, descricao,
  saldo, fisico, reservado, estoque_minimo, preco_unitario,
  round(saldo * preco_unitario) as valor_em_estoque,
  case when estoque_minimo is not null and saldo <= estoque_minimo
       then true else false end as abaixo_minimo,
  data_posicao
from public.fato_loja_estoque
order by descricao;
grant select on public.vw_loja_estoque to authenticated;

notify pgrst, 'reload schema';
