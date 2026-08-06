-- ============================================================
-- FebraHub · Migration 20b — Cursos por consultora (para o hover do ranking)
--
-- Ao passar o mouse numa consultora no ranking, mostra os cursos que
-- ela vendeu naquela categoria/período, com quanto de cada. Mesma
-- lógica do ranking histórico (atual vs. Danilo, split no CI).
-- ============================================================

drop view if exists public.vw_comercial_cursos_por_consultora cascade;
create view public.vw_comercial_cursos_por_consultora as
select
  case
    when cur.tipo = 'GGB'                 then 'GGB'
    when cur.tipo = 'CIS'                 then 'CIS'
    when cur.tipo = 'Coaching Individual' then 'CI'
  end                                            as categoria,
  -- mesma identidade do ranking histórico (Danilo vs Marlany)
  case
    when p.consultor_id = 'Marlany Santos de Bona Fernandes'
         and p.data_pagamento < '2025-05-07'
      then 'Danilo'
    else coalesce(cons.nome, p.consultor_id)
  end                                            as consultora,
  cur.nome_curso                                 as curso,
  p.data_pagamento                               as data,
  case when cur.tipo = 'Coaching Individual'
       then p.valor * 0.5 else p.valor end        as valor
from public.fato_pagamento_base p
join public.fato_base_alunos m on m.original_id_venda = p.original_id_venda
join public.dim_cursos cur       on cur.curso_id = m.curso_id
left join public.dim_consultores cons on cons.consultor_id = p.consultor_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento is not null
  and cur.tipo in ('GGB','CIS','Coaching Individual')
  and public.pode_ver('comercial');

grant select on public.vw_comercial_cursos_por_consultora to authenticated;

-- NOTA front: no hover de uma consultora no ranking, filtrar esta view
-- por consultora + categoria + período, agrupar por `curso`:
--   vendas = count(*)  |  receita = sum(valor)
-- Mostrar top 3-5 cursos num tooltip (curso, nº vendas, receita).
