-- ============================================================
-- FebraHub · Migration 30 — Corrige vw_financeiro_receita
--
-- A versão anterior usava JOIN LATERAL, que o PostgREST não
-- consegue expor (erro 500 na API, embora funcione no SQL).
-- Reescrita com subconsulta agregada.
-- ============================================================

drop view if exists public.vw_financeiro_receita cascade;
create view public.vw_financeiro_receita as
with atributos as (
  -- 1 linha por venda com os atributos de exibição
  select
    original_id_venda,
    max(unidade_geradora_venda) as unidade_geradora_venda,
    max(status_pagamento)       as status_pagamento,
    max(forma_pagamento)        as forma_pagamento
  from public.fato_pagamento_base
  group by original_id_venda
)
select
  date_trunc('month', f.data_pagamento)::date        as mes,
  coalesce(a.unidade_geradora_venda,'nao_informado') as unidade,
  'curso'::text                                      as tipo_receita,
  a.status_pagamento,
  a.forma_pagamento,
  count(*)                                           as transacoes,
  sum(f.valor_bruto)                                 as valor_bruto,
  sum(f.valor)                                       as valor_liquido
from public.vw_venda_faturamento f
left join atributos a on a.original_id_venda = f.original_id_venda
where public.pode_ver('financeiro')
group by 1,2,3,4,5

union all

select
  date_trunc('month', e.data_pedido)::date as mes,
  'eventos'::text                          as unidade,
  'evento'::text                           as tipo_receita,
  e.status_pedido                          as status_pagamento,
  e.forma_pagamento,
  count(*)                                 as transacoes,
  sum(e.valor_total)                       as valor_bruto,
  sum(e.valor_liquido)                     as valor_liquido
from public.fato_pedidos e
where public.pode_ver('financeiro')
group by 1,2,3,4,5;

grant select on public.vw_financeiro_receita to authenticated;

notify pgrst, 'reload schema';
