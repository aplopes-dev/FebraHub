-- ============================================================
-- FebraHub · Migration 09 — Séries mensais (Hub Executivo)
-- Nomes de coluna alinhados com o que o front já espera:
--   receita_mensal: mes, receita
--   caixa_mensal:   mes, caixa
-- ============================================================

-- Evolução mensal da receita — usa receita_unidade (com split 50/50
-- do coaching já aplicado). É a receita REAL da Febracis, não a bruta.
create or replace view public.vw_financeiro_receita_mensal as
select
  date_trunc('month', p.data_pagamento)::date as mes,
  sum(case when c.tipo = 'Coaching Individual'
           then p.valor * 0.5 else p.valor end) as receita
from public.fato_pagamento_base p
left join public.fato_base_alunos m on m.original_id_venda = p.original_id_venda
left join public.dim_cursos c on c.curso_id = m.curso_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento is not null
  and public.pode_ver('financeiro')
group by 1
order by 1;

-- Caixa recebido no mês — SÓ CisPay (Stone não integrada).
-- O card já rotula como parcial; aqui só entregamos o número.
create or replace view public.vw_financeiro_caixa_mensal as
select
  date_trunc('month', data_liquidacao)::date as mes,
  sum(valor_liquido)                         as caixa
from public.fato_liquidacao_cartao
where public.pode_ver('financeiro')
  and tipo_transacao = 'Credit'
  and data_liquidacao is not null
group by 1
order by 1;

grant select on
  public.vw_financeiro_receita_mensal,
  public.vw_financeiro_caixa_mensal
to authenticated;
