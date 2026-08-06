-- ============================================================
-- FebraHub · Migration 16b — Placar com data de largada
--
-- A gamificação começa a contar em 01/01/2025 (data de largada
-- definida pela gestora). Vendas anteriores NÃO contam — o jogo
-- nasce zerado e justo, sem arrastar histórico de anos.
-- Só as 3 consultoras ativas do time GGB entram.
-- ============================================================

drop view if exists public.vw_comercial_placar cascade;

create view public.vw_comercial_placar as
with contagem as (
  select
    c.consultor_id,
    c.consultora,
    cons.foto_url,
    count(*) filter (where c.carinha = 'verde')    as verdes_total,
    count(*) filter (where c.carinha = 'vermelho') as vermelhas_total,
    count(*) filter (where c.carinha = 'amarelo')  as amarelas_total
  from public.vw_comercial_carinhas c
  join public.dim_consultores cons on cons.consultor_id = c.consultor_id
  where cons.ativa = true
    and c.carinha is not null
    and c.data_pagamento >= '2025-01-01'      -- DATA DE LARGADA
  group by 1, 2, 3
)
select
  consultor_id,
  consultora,
  foto_url,
  verdes_total,
  vermelhas_total,
  amarelas_total,
  verdes_total % 10                    as verdes_no_ciclo,
  vermelhas_total % 10                 as vermelhas_no_ciclo,
  verdes_total / 10                    as brindes_ganhos,
  vermelhas_total / 10                 as semanais_perdidas,
  10 - (verdes_total % 10)             as faltam_brinde,
  10 - (vermelhas_total % 10)          as faltam_perder
from contagem
order by verdes_total desc, vermelhas_total asc;

grant select on public.vw_comercial_placar to authenticated;
