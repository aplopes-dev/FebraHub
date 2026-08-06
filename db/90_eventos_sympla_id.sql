-- ============================================================
-- 90 — PONTE COM O SYMPLA
-- Aplicado no Supabase em 06/08/2026, depois do 89.
--
-- Palestras, workshops e mentorias não vêm do Salesforce: são
-- vendidos pelo Sympla. `dim_turmas` é turma de curso com aluno
-- matriculado (CIS-GL, BHP, IF, FOP) e não cobre esse caso —
-- por isso `eventos` existe separado, não duplicado.
--
-- A coluna nasce vazia e continua vazia enquanto o cadastro for
-- manual. Ela existe desde já para que a sincronia futura case o
-- evento pelo ID, e não pelo título: título redigitado sempre
-- diverge ("Liderança que Sustenta Resultado" no Sympla vira
-- "Palestra Liderança" no cadastro), e título divergente parte a
-- carteira em duas linhas — que é justamente o que faz o NPS
-- acumulado parar de decidir qualquer coisa.
--
-- `unique` para que o mesmo evento do Sympla não entre duas vezes.
-- ============================================================

alter table eventos add column sympla_evento_id text unique;

comment on column eventos.sympla_evento_id is
  'ID do evento no Sympla. Nulo enquanto o cadastro for manual.
   Existe para que a importação futura case por ID em vez de título.
   Não aparece no formulário de cadastro.';
