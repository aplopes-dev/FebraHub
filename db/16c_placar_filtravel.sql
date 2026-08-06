-- ============================================================
-- FebraHub · Migration 16c — Placar filtrável por período
--
-- MUDANÇA: o placar agora é recortável por período (o front filtra
-- pela data). Tudo conta DENTRO do período selecionado:
--   - carinhas verde/amarelo/vermelho do período
--   - presentes = verdes_no_periodo / 10 (a cada 10 verdes, 1 presente;
--     20 verdes = 2 presentes, e assim por diante)
--
-- NÃO mostra mais "perdeu a semanal" na tela (decisão: punição pública
-- não fica legal). A contagem de vermelhas continua existindo (útil
-- para a gestão ver em privado), só não vira rótulo de punição.
--
-- Como o filtro é no cliente, esta view entrega as carinhas COM a
-- coluna data; o front recorta o período e agrega. Substitui o uso
-- da vw_comercial_placar (que era agregada e fixa).
-- ============================================================

-- Carinhas por venda, com data e já restritas ao time GGB ativo,
-- desde a largada (jan/2025). O front filtra o período sobre isto.
drop view if exists public.vw_comercial_carinhas_ggb cascade;
create view public.vw_comercial_carinhas_ggb as
select
  c.consultor_id,
  c.consultora,
  cons.foto_url,
  c.data_pagamento,
  c.valor,
  c.carinha
from public.vw_comercial_carinhas c
join public.dim_consultores cons on cons.consultor_id = c.consultor_id
where cons.ativa = true
  and c.carinha is not null
  and c.data_pagamento >= '2025-01-01';   -- largada

grant select on public.vw_comercial_carinhas_ggb to authenticated;

-- ============================================================
-- NOTA para o front (Claude Code):
-- Esta view entrega UMA LINHA POR VENDA com: consultor_id, consultora,
-- foto_url, data_pagamento, valor, carinha ('verde'|'amarelo'|'vermelho').
--
-- O filtro de período recorta por data_pagamento. Depois, por consultora:
--   verdes    = count(carinha='verde'   no período)
--   amarelas  = count(carinha='amarelo' no período)
--   vermelhas = count(carinha='vermelho' no período)
--   presentes = floor(verdes / 10)      -- 20 verdes = 2 presentes
--   faltam    = 10 - (verdes % 10)      -- quantas pro próximo presente
--
-- NÃO exibir "perdeu a semanal". As vermelhas aparecem só como contador
-- (🔴 N), sem rótulo de punição.
-- ============================================================
