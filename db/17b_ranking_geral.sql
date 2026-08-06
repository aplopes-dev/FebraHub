-- ============================================================
-- FebraHub · Migration 17b — Ranking geral acumulado (hall da fama)
--
-- Complementa o vw_comercial_ranking_periodo (que filtra por data).
-- Este é o ACUMULADO de todos os tempos, não muda com o filtro.
-- A tela terá os dois: pódio do período (filtra) + geral (fixo).
-- ============================================================

drop view if exists public.vw_comercial_ranking_geral cascade;
create view public.vw_comercial_ranking_geral as
select
  p.consultor_id,
  cons.nome                          as consultora,
  cons.foto_url,
  count(*)                           as vendas,
  round(sum(p.valor))                as receita,
  round(avg(p.valor))                as ticket_medio,
  min(p.data_pagamento)              as primeira_venda
from public.fato_pagamento_base p
join public.dim_consultores cons on cons.consultor_id = p.consultor_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and cons.ativa = true                 -- time GGB
  and public.pode_ver('comercial')
group by 1, 2, 3
order by receita desc;

grant select on public.vw_comercial_ranking_geral to authenticated;
