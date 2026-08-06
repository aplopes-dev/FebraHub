-- ============================================================
-- FebraHub · Migration 75 — Simplifica fato_avaliacao_evento
--
-- As perguntas dos formulários de evento VARIAM entre eventos. O que é
-- comum a todos (e o que importa para o NPS) é a NOTA DE INDICAÇÃO.
-- A tabela guarda só o essencial comum; perguntas específicas de cada
-- evento não entram (não são comparáveis entre eventos diferentes).
--
-- Se quiser guardar as respostas variáveis no futuro, adiciona uma
-- coluna jsonb 'respostas' — mas para NPS, indicação basta.
-- ============================================================

-- as colunas q_* específicas saem (não se aplicam a formulários variáveis);
-- ficam evento, data, nota_indicacao, comentario. Se já há dados, preserva.
alter table public.fato_avaliacao_evento drop column if exists q_conteudo;
alter table public.fato_avaliacao_evento drop column if exists q_clareza;
alter table public.fato_avaliacao_evento drop column if exists q_material;

-- opcional: guardar todas as respostas do form em jsonb, para não perder
-- as perguntas específicas (o hub mostra só o NPS, mas o dado fica gravado)
alter table public.fato_avaliacao_evento
  add column if not exists respostas jsonb;

notify pgrst, 'reload schema';
