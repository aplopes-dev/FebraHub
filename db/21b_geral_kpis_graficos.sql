-- ============================================================
-- FebraHub · Migration 21b — KPIs e gráficos no modo GERAL
--
-- Soma GGB + CI + CIS (formação, sem Sympla) por mês, para os KPIs
-- e os gráficos (evolução + matrículas vs faturamento) no modo Geral.
-- CI com split 50/50.
-- ============================================================

drop view if exists public.vw_comercial_geral_mensal cascade;
create view public.vw_comercial_geral_mensal as
select
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
  and cur.tipo in ('GGB','CIS','Coaching Individual')   -- sem Sympla
  and public.pode_ver('comercial');

grant select on public.vw_comercial_geral_mensal to authenticated;

-- NOTA front: modo Geral usa esta view.
--   KPIs: faturamento = sum(valor) no período; matriculas = count(*);
--         ticket = faturamento/matriculas; YoY = comparar com ano anterior.
--   Gráfico evolução: sum(valor) por mes.
--   Gráfico matriculas vs faturamento: count(*) e sum(valor) por mes.
-- Tudo já com split 50/50 no CI e sem Sympla.
