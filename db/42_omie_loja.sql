-- ============================================================
-- FebraHub · Migration 42 — Loja (Omie): vendas e estoque
--
-- Fonte: Omie PDV.
--   Vendas  = CuponsFiscais + CuponsItens (cupom fiscal / NFC-e)
--   Estoque = ListarPosEstoque (posição do saldo por produto)
--
-- Regras (iguais ao resto do projeto):
--   - excluir cupons cancelados (cCupomCancelado='S') e devolvidos
--   - valor de venda = nValorCupom (cabeçalho) ou soma de vItem (itens)
-- ============================================================

-- Cabeçalho dos cupons (1 linha por cupom = 1 venda)
create table if not exists public.fato_loja_cupom (
  cupom_id         bigint primary key,        -- nIdCupom
  numero_cupom     integer,                    -- nNumCupom
  serie            text,
  chave            text,                       -- cChaveCupom
  data_emissao     date,                       -- dDtEmissaoCupom
  valor            numeric,                    -- nValorCupom
  cliente_id       integer,
  vendedor_id      integer,
  cancelado        boolean default false,      -- cCupomCancelado='S'
  devolvido        boolean default false,      -- cCupomDevolvido='S'
  atualizado_em    timestamptz default now()
);
grant select on public.fato_loja_cupom to authenticated;

-- Itens dos cupons (1 linha por produto vendido)
create table if not exists public.fato_loja_item (
  cupom_id         bigint,                     -- nIdCupom
  seq_item         integer,                    -- seqItem
  produto_id       integer,                    -- idProduto
  descricao        text,                       -- xProd
  quantidade       numeric,                    -- nQuant
  valor_unitario   numeric,                    -- vUnit
  valor_item       numeric,                    -- vItem (líquido)
  quantidade_dev   numeric default 0,          -- nQuantDev
  cancelado        boolean default false,      -- cItemCancelado='S'
  atualizado_em    timestamptz default now(),
  primary key (cupom_id, seq_item)
);
grant select on public.fato_loja_item to authenticated;

-- Posição de estoque (foto do saldo por produto, atualizada a cada sync)
create table if not exists public.fato_loja_estoque (
  produto_id       integer primary key,        -- nCodProd
  codigo           text,                       -- cCodigo
  descricao        text,                       -- cDescricao
  preco_unitario   numeric,                    -- nPrecoUnitario
  saldo            numeric,                     -- nSaldo
  fisico           numeric,                     -- fisico
  reservado        numeric,                     -- reservado
  estoque_minimo   numeric,                     -- estoque_minimo
  data_posicao     date,
  atualizado_em    timestamptz default now()
);
grant select on public.fato_loja_estoque to authenticated;

-- ------------------------------------------------------------
-- Views de leitura
-- ------------------------------------------------------------

-- Vendas por mês (exclui cancelados)
drop view if exists public.vw_loja_vendas_mensal cascade;
create view public.vw_loja_vendas_mensal as
select
  date_trunc('month', data_emissao)::date as mes,
  count(*)             as cupons,
  round(sum(valor))    as faturamento
from public.fato_loja_cupom
where not cancelado
group by 1 order by 1;
grant select on public.vw_loja_vendas_mensal to authenticated;

-- Produtos mais vendidos (exclui itens cancelados)
drop view if exists public.vw_loja_produtos_vendidos cascade;
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

-- Estoque atual (saldo por produto)
drop view if exists public.vw_loja_estoque cascade;
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
