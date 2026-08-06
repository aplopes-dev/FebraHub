-- ============================================================
-- FebraHub · Migration 17 — Ranking (pódio) filtrável por período
--
-- O pódio não filtrava porque vw_comercial_ranking entregava só o
-- total agregado, sem datas. Esta view entrega UMA LINHA POR VENDA
-- com data, para o front recortar pelo período e reagrupar.
--
-- Restrita ao time GGB ativo. Sem corte de data aqui (o front decide
-- o período); mas se quiser alinhar com a largada da gamificação,
-- o front pode ignorar vendas antes de 2025.
-- ============================================================

drop view if exists public.vw_comercial_ranking_periodo cascade;
create view public.vw_comercial_ranking_periodo as
select
  p.consultor_id,
  cons.nome                          as consultora,
  cons.foto_url,
  p.data_pagamento                   as data,
  p.valor
from public.fato_pagamento_base p
join public.dim_consultores cons on cons.consultor_id = p.consultor_id
where p.tipo_matricula = 'Matrícula'
  and p.valor is not null
  and p.data_pagamento is not null
  and cons.ativa = true                 -- só o time GGB
  and public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_periodo to authenticated;

-- ============================================================
-- NOTA para o front (Claude Code):
-- Uma linha por venda: consultor_id, consultora, foto_url, data, valor.
-- O filtro recorta por `data`. Depois, por consultora:
--   receita     = sum(valor) no período
--   vendas      = count(*) no período
--   ticket      = avg(valor) no período
-- Ordenar por receita desc para montar o pódio (1º, 2º, 3º).
--
-- Quando o período muda, o pódio inteiro recalcula — inclusive a
-- ORDEM pode mudar (quem lidera em julho pode não liderar no ano).
-- ============================================================
