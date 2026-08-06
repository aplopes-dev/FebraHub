-- ============================================================
-- FebraHub · Migration 19b — Carinhas só do time GGB
--
-- BUG corrigido: a vw_comercial_carinhas_ggb filtrava por ativa=true,
-- mas agora Cássia e Marlany também são ativas (têm foto), então elas
-- vazaram pro placar de carinhas. As carinhas são EXCLUSIVAS das 3 GGB.
--
-- Solução: amarrar explicitamente nos 3 consultor_id do GGB, em vez
-- de depender de ativa=true.
-- ============================================================

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
where c.carinha is not null
  and c.data_pagamento >= '2025-01-01'      -- largada da gamificação
  and c.consultor_id in (                    -- SÓ as 3 do GGB, explícito
    'Alana Faleiro Coutinho',
    'Beatriz Souza',
    'Beatriz Martins de Novaes'
  );

grant select on public.vw_comercial_carinhas_ggb to authenticated;
