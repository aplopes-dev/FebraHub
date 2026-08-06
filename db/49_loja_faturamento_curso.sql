-- ============================================================
-- FebraHub · Migration 49 — Faturamento da loja por curso (Sheets)
--
-- Fonte: aba FATURAMENTO da planilha da gestora da loja.
-- Registra quanto a LOJA vendeu durante cada curso/turma, com a
-- divisão por forma de pagamento e a quantidade de alunos.
--
-- ATENÇÃO: é o MESMO dinheiro do Omie, visto por outro ângulo.
--   Omie      -> quanto a loja faturou (número oficial de receita)
--   Esta aba  -> qual curso faz a loja vender mais (ranking)
-- NUNCA somar as duas fontes.
--
-- Cobertura: 2023 até junho/2026 (a planilha para aí).
-- ============================================================

create table if not exists public.fato_loja_curso (
  id              bigserial primary key,
  mes_ref         date,          -- 1o dia do mês, montado de MÊS + ANO
  ano             integer,
  mes_nome        text,
  periodo         text,          -- coluna DATA, ex: "10-13" (intervalo de dias)
  curso           text,
  turma           text,
  treinador       text,
  dinheiro        numeric,
  debito          numeric,
  credito         numeric,
  pix             numeric,
  total           numeric,       -- TOTAL P/CURSO
  meta            numeric,       -- META P/TURMA
  alunos          integer,
  ticket_medio    numeric,
  atualizado_em   timestamptz default now(),
  unique (mes_ref, curso, turma, treinador)
);
grant select on public.fato_loja_curso to authenticated;

-- ---------- Ranking de cursos que mais fazem a loja vender ----------
drop view if exists public.vw_loja_performance_curso cascade;
create view public.vw_loja_performance_curso as
select
  mes_ref,
  ano,
  curso,
  count(*)                                  as turmas,
  sum(coalesce(alunos,0))                   as alunos,
  round(sum(coalesce(total,0)))             as faturamento,
  round(sum(coalesce(meta,0)))              as meta,
  case when sum(coalesce(alunos,0)) > 0
       then round(sum(coalesce(total,0)) / sum(alunos), 2) end as por_aluno,
  case when sum(coalesce(meta,0)) > 0
       then round(100.0 * sum(coalesce(total,0)) / sum(meta), 1) end as pct_meta
from public.fato_loja_curso
where public.pode_ver('loja')
group by 1,2,3;
grant select on public.vw_loja_performance_curso to authenticated;

-- ---------- Resumo mensal (realizado x meta) ----------
drop view if exists public.vw_loja_curso_mensal cascade;
create view public.vw_loja_curso_mensal as
select
  mes_ref,
  ano,
  count(distinct curso)             as cursos,
  sum(coalesce(alunos,0))           as alunos,
  round(sum(coalesce(total,0)))     as faturamento,
  round(sum(coalesce(meta,0)))      as meta
from public.fato_loja_curso
where public.pode_ver('loja')
group by 1,2
order by 1;
grant select on public.vw_loja_curso_mensal to authenticated;

notify pgrst, 'reload schema';
