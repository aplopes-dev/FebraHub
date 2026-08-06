-- ============================================================
-- FebraHub · Migration 76 — Proteção contra duplicata no NPS de eventos
--
-- Ao trazer o histórico do Make Forms, o cenário pode rodar mais de uma
-- vez. Cada resposta do Make Forms tem um ID único — guardá-lo com
-- restrição de unicidade impede inserir a mesma resposta duas vezes.
--
-- No Make, mapear o ID da resposta para 'resposta_id'. Com on_conflict,
-- reprocessar o histórico não duplica (a resposta repetida é ignorada).
-- ============================================================

alter table public.fato_avaliacao_evento
  add column if not exists resposta_id text;

-- unicidade: uma resposta do Make só entra uma vez
create unique index if not exists uq_avaliacao_evento_resposta
  on public.fato_avaliacao_evento (resposta_id)
  where resposta_id is not null;

notify pgrst, 'reload schema';
