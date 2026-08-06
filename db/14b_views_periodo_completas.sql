-- ============================================================
-- FebraHub · Migration 14b — Completa as views _periodo
--
-- As views _periodo da migration 14 vieram enxutas. Os cards
-- existentes esperam mais colunas:
--   receita: receita_bruta, receita_unidade, repasse_coach (split 50/50)
--   despesa: total, pago (quanto já saiu)
--
-- Aqui recriamos as três com TODAS as colunas + a dimensão data.
-- ============================================================

-- ---------- RECEITA POR CATEGORIA (com 50/50) ----------
drop view if exists public.vw_financeiro_receita_categoria_periodo cascade;
create view public.vw_financeiro_receita_categoria_periodo as
select
  coalesce(c.tipo, 'Sem vínculo')              as categoria,
  date_trunc('month', p.data_pagamento)::date  as mes,
  p.data_pagamento                             as data,
  count(*)                                     as vendas,
  sum(p.valor)                                 as receita_bruta,
  sum(case when c.tipo = 'Coaching Individual'
           then p.valor * 0.5 else p.valor end) as receita_unidade,
  sum(case when c.tipo = 'Coaching Individual'
           then p.valor * 0.5 else 0 end)       as repasse_coach
from public.fato_pagamento_base p
left join public.fato_base_alunos m on m.original_id_venda = p.original_id_venda
left join public.dim_cursos c on c.curso_id = m.curso_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento is not null
  and public.pode_ver('financeiro')
group by 1, 2, 3;

-- ---------- DESPESA POR CATEGORIA (com pago) ----------
drop view if exists public.vw_financeiro_despesa_categoria_periodo cascade;
create view public.vw_financeiro_despesa_categoria_periodo as
select
  coalesce(categoria, 'Sem categoria')       as categoria,
  date_trunc('month', data_pagamento)::date  as mes,
  data_pagamento                             as data,
  count(*)                                   as parcelas,
  sum(valor)                                 as total,
  sum(coalesce(valor_pago, valor))           as pago
from public.fato_contas_pagar
where public.pode_ver('financeiro')
  and data_pagamento is not null
group by 1, 2, 3;

-- ---------- LOJA — receita por forma (com recebido) ----------
drop view if exists public.vw_loja_receita_periodo cascade;
create view public.vw_loja_receita_periodo as
select
  case
    when categoria ilike '%conta bancária%' or categoria ilike '%conta bancaria%'
      then 'Cartão/PIX'
    when categoria ilike '%caixa%' then 'Dinheiro'
    else 'Outros'
  end                                        as forma,
  date_trunc('month', coalesce(data_pagamento, data_vencimento))::date as mes,
  coalesce(data_pagamento, data_vencimento)  as data,
  count(*)                                   as vendas,
  sum(valor)                                 as receita,
  sum(valor) filter (where data_pagamento is not null) as recebido
from public.fato_contas_receber
where public.pode_ver('loja')
  and categoria ilike '%centro conceito%'
group by 1, 2, 3;

grant select on
  public.vw_financeiro_receita_categoria_periodo,
  public.vw_financeiro_despesa_categoria_periodo,
  public.vw_loja_receita_periodo
to authenticated;
