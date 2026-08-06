-- ============================================================
-- FebraHub · Migration 45 — Estoque a valor de custo
--
-- O card "valor em estoque" usava preco_unitario (preço de VENDA),
-- superestimando o capital imobilizado. O Omie devolve o CMC
-- (custo médio contábil) no campo nCMC da posição de estoque.
--
-- Agora a view traz os dois: valor a custo (capital imobilizado real)
-- e valor a preço de venda (potencial de receita).
--
-- Rodar ANTES de recarregar o ETL, para a coluna existir.
-- ============================================================

alter table public.fato_loja_estoque
  add column if not exists custo_medio numeric;

drop view if exists public.vw_loja_estoque cascade;
create view public.vw_loja_estoque as
select
  produto_id, codigo, descricao,
  saldo, fisico, reservado, estoque_minimo,
  preco_unitario,
  custo_medio,
  round(saldo * coalesce(custo_medio,0))     as valor_custo,      -- capital imobilizado
  round(saldo * coalesce(preco_unitario,0))  as valor_venda,      -- potencial de receita
  -- alerta só quando há mínimo definido de verdade
  case when coalesce(estoque_minimo,0) > 0 and saldo <= estoque_minimo
       then true else false end              as abaixo_minimo,
  -- produto sem giro nem cadastro de mínimo (não é urgência, é limpeza)
  case when coalesce(estoque_minimo,0) = 0 and coalesce(saldo,0) = 0
       then true else false end              as sem_movimento,
  data_posicao
from public.fato_loja_estoque
order by descricao;

grant select on public.vw_loja_estoque to authenticated;

notify pgrst, 'reload schema';
