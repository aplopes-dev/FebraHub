-- ============================================================
-- FebraHub · Migration 14 — Views com dimensão de data (filtro)
--
-- O filtro (Ano / Mês / Últimos 7 dias) age sobre FLUXO, pela
-- data_pagamento. Estado (inadimplência, a receber/pagar futuro)
-- NÃO entra no filtro — é snapshot do agora, não fluxo do período.
--
-- Estratégia: as views de fluxo passam a incluir data_pagamento
-- (ou o mês) na saída. O front recorta pelo período escolhido.
-- Só linhas COM data_pagamento entram (o que efetivamente entrou/saiu).
-- ============================================================

-- ---------- RECEITA POR CATEGORIA (curso, Salesforce) ----------
-- Antes: só total acumulado. Agora: com mês, para filtrar.
drop view if exists public.vw_financeiro_receita_categoria_periodo cascade;
create view public.vw_financeiro_receita_categoria_periodo as
select
  coalesce(c.tipo, 'Sem vínculo')              as categoria,
  date_trunc('month', p.data_pagamento)::date  as mes,
  p.data_pagamento                             as data,
  sum(case when c.tipo = 'Coaching Individual'
           then p.valor * 0.5 else p.valor end) as receita_unidade,
  count(*)                                     as vendas
from public.fato_pagamento_base p
left join public.fato_base_alunos m on m.original_id_venda = p.original_id_venda
left join public.dim_cursos c on c.curso_id = m.curso_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento is not null
  and public.pode_ver('financeiro')
group by 1, 2, 3;

-- ---------- DESPESA POR CATEGORIA (Conta Azul) ----------
drop view if exists public.vw_financeiro_despesa_categoria_periodo cascade;
create view public.vw_financeiro_despesa_categoria_periodo as
select
  coalesce(categoria, 'Sem categoria')       as categoria,
  date_trunc('month', data_pagamento)::date  as mes,
  data_pagamento                             as data,
  sum(coalesce(valor_pago, valor))           as total,
  count(*)                                   as parcelas
from public.fato_contas_pagar
where public.pode_ver('financeiro')
  and data_pagamento is not null      -- despesa que saiu do caixa
group by 1, 2, 3;

-- ---------- LOJA — receita por forma ----------
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
  sum(valor)                                 as receita,
  count(*)                                   as vendas
from public.fato_contas_receber
where public.pode_ver('loja')
  and categoria ilike '%centro conceito%'
group by 1, 2, 3;

grant select on
  public.vw_financeiro_receita_categoria_periodo,
  public.vw_financeiro_despesa_categoria_periodo,
  public.vw_loja_receita_periodo
to authenticated;

-- ============================================================
-- NOTA para o front:
-- Estas views trazem a coluna "data" (data_pagamento). O filtro no
-- cliente recorta:
--   Ano            -> data >= 1º jan do ano selecionado
--   Mês            -> data no mês selecionado
--   Últimos 7 dias -> data >= hoje - 7
-- Depois agrega (soma por categoria/forma) só as linhas do período.
--
-- As mensais que já existem (receita_mensal, pago_mensal,
-- loja_receita_mensal) servem para os gráficos de linha e não
-- precisam de filtro — mostram a série inteira sempre.
--
-- As views de ESTADO (inadimplencia_origem, a_receber_horizonte,
-- a_pagar_horizonte) NÃO recebem filtro — são o retrato de agora.
-- ============================================================
