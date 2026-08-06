-- ============================================================
-- FebraHub · Migration 77 (revisada) — Ajustes para o webhook
--
-- A tentativa anterior de alterar o tipo de data_evento falhou porque
-- a view vw_pedagogico_nps_evento já usa a coluna — o que significa que
-- ela já está no tipo certo (date). Então esse passo era desnecessário.
--
-- Sobra só garantir a coluna resposta_id e o índice anti-duplicata
-- (idempotente com a mig 76). Se a 76 já rodou, esta não faz nada de novo.
-- ============================================================

alter table public.fato_avaliacao_evento
  add column if not exists resposta_id text;

create unique index if not exists uq_avaliacao_evento_resposta
  on public.fato_avaliacao_evento (resposta_id)
  where resposta_id is not null;

-- Sobre a data: o webhook manda submitted_at como timestamp (com hora).
-- A coluna data_evento é date. O Supabase/PostgREST corta a hora
-- automaticamente ao inserir string ISO numa coluna date — então
-- "2026-07-28T14:30:00Z" vira 2026-07-28 sem erro. Não precisa alterar.

notify pgrst, 'reload schema';
