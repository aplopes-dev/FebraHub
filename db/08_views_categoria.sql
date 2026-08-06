-- ============================================================
-- FebraHub · Migration 08 — Views de receita por categoria (corrigida)
-- Rode DEPOIS da 07 e 07b.
--
-- CORREÇÃO: fato_pagamento_base.curso_id está VAZIO (0/7639).
-- O curso vem pela matrícula:
--   pagamento -> original_id_venda -> fato_base_alunos -> curso_id -> dim_cursos
-- Cobertura da ponte: 89% (6.870/7.717). Os 11% sem matrícula
-- correspondem ao buraco de pagamentos órfãos já catalogado.
--
-- REGRAS DE NEGÓCIO:
-- 1. Coaching Individual: split 50/50. receita_unidade = o que fica com a casa.
-- 2. Bônus: cortesia, fora do total.
-- 3. Pagamentos sem matrícula casada entram como categoria 'Sem vínculo'
--    para a receita não sumir silenciosamente (transparência de cobertura).
-- ============================================================

create or replace view public.vw_financeiro_receita_categoria as
select
  coalesce(c.tipo, 'Sem vínculo')              as categoria,
  date_trunc('month', p.data_pagamento)::date  as mes,
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
  and public.pode_ver('financeiro')
group by 1, 2;

create or replace view public.vw_financeiro_receita_categoria_total as
select
  coalesce(c.tipo, 'Sem vínculo')              as categoria,
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
  and coalesce(c.tipo, 'x') <> 'Bônus'
  and public.pode_ver('financeiro')
group by 1
order by receita_unidade desc;

grant select on
  public.vw_financeiro_receita_categoria,
  public.vw_financeiro_receita_categoria_total
to authenticated;
