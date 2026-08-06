-- ============================================================
-- FebraHub · Migration 20 — Matrículas vs. Faturamento por mês/categoria
--
-- Alimenta o gráfico de duas séries: volume de matrículas (barras/linha)
-- vs. faturamento (linha). Revela se o crescimento vem de MAIS VENDAS
-- ou de TICKET MAIOR. Uma linha por venda, com mês e categoria, para o
-- front agrupar e o filtro recortar.
-- ============================================================

drop view if exists public.vw_comercial_matriculas_faturamento cascade;
create view public.vw_comercial_matriculas_faturamento as
select
  case
    when cur.tipo = 'GGB'                 then 'GGB'
    when cur.tipo = 'CIS'                 then 'CIS'
    when cur.tipo = 'Coaching Individual' then 'CI'
    else null
  end                                            as categoria,
  date_trunc('month', p.data_pagamento)::date    as mes,
  p.data_pagamento                               as data,
  case when cur.tipo = 'Coaching Individual'
       then p.valor * 0.5 else p.valor end        as valor
from public.fato_pagamento_base p
join public.fato_base_alunos m on m.original_id_venda = p.original_id_venda
join public.dim_cursos cur       on cur.curso_id = m.curso_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento is not null
  and cur.tipo in ('GGB','CIS','Coaching Individual')
  and public.pode_ver('comercial');

grant select on public.vw_comercial_matriculas_faturamento to authenticated;

-- NOTA front: filtra por categoria + período (data). Agrupa por `mes`:
--   matriculas = count(*)   |   faturamento = sum(valor)
-- Duas séries no mesmo gráfico: barras de matrículas + linha de faturamento
-- (ou duas linhas com eixos Y diferentes). Se as duas sobem juntas =
-- crescimento por volume. Se faturamento sobe mais que matrículas =
-- ticket subindo. Insight direto pra diretoria.
