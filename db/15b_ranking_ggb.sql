-- ============================================================
-- FebraHub · Migration 15b — Ranking e gamificação restritos ao time GGB
--
-- O ranking e a gamificação mostram SÓ as consultoras ativas
-- (o time GGB: Alana, Beatriz Souza, Beatriz Novaes). As vendas
-- de cada uma estão limpas num único consultor_id (o do Salesforce);
-- os IDs "Do Clint" têm zero vendas e ficam de fora.
-- ============================================================

-- Ranking: todas as vendas das consultoras ativas, no ano corrente
create or replace view public.vw_comercial_ranking as
select
  p.consultor_id,
  cons.nome                          as consultora,
  cons.foto_url,
  count(*)                           as vendas,
  round(sum(p.valor))                as receita,
  round(avg(p.valor))                as ticket_medio
from public.fato_pagamento_base p
join public.dim_consultores cons on cons.consultor_id = p.consultor_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and cons.ativa = true                 -- só o time GGB
  and public.pode_ver('comercial')
group by 1, 2, 3
order by receita desc;

-- Placar semanal (carinhas) restrito ao time ativo
create or replace view public.vw_comercial_placar_semana as
select
  c.consultor_id,
  c.consultora,
  cons.foto_url,
  count(*) filter (where c.carinha = 'verde')    as verdes,
  count(*) filter (where c.carinha = 'vermelho') as vermelhas,
  count(*) filter (where c.carinha = 'neutro')   as neutras,
  count(*)                                       as vendas_total,
  (count(*) filter (where c.carinha = 'vermelho') >= 10) as perdeu_semanal
from public.vw_comercial_carinhas c
join public.dim_consultores cons on cons.consultor_id = c.consultor_id
where c.semana = date_trunc('week', current_date)::date
  and cons.ativa = true
group by 1, 2, 3
order by verdes desc, vermelhas asc;

grant select on
  public.vw_comercial_ranking,
  public.vw_comercial_placar_semana
to authenticated;
