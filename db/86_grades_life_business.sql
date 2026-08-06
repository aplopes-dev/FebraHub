-- ============================================================
-- FebraHub · Migration 86 — Grades Life e Business (análise Dulce)
--
-- Marca cada curso conforme a grade do Notion. Um curso pode estar em
-- Life, Business, ou nos DOIS (o Método CIS é porta de entrada comum).
--
-- Grade LIFE (desenvolvimento pessoal/emocional):
--   Método CIS, Formação em Coaching Integral Sistêmico, Master Coaching,
--   Inteligência Financeira, Perf. e Comportamento Humano, Alta Perf. Saúde
--
-- Grade BUSINESS (negócios/liderança):
--   Método CIS, ML5, Business High Performance, Planejamento Estratégico,
--   Growth, Oradores e Palestrantes no Mundo Business
-- ============================================================

alter table public.dim_cursos add column if not exists grade_life boolean default false;
alter table public.dim_cursos add column if not exists grade_business boolean default false;

-- zera para reprocessar limpo
update public.dim_cursos set grade_life = false, grade_business = false;

-- ---------- LIFE ----------
-- Método CIS (todas as variações CIS entram como porta de entrada)
update public.dim_cursos set grade_life = true
where tipo = 'CIS';

-- Formação em Coaching Integral Sistêmico (nacional e internacional)
update public.dim_cursos set grade_life = true
where curso_id ilike '%COACHING INTEGRAL SISTÊMICO%'
  and curso_id not ilike '%ML5%';

-- Master Coaching
update public.dim_cursos set grade_life = true
where curso_id ilike '%MASTER COACHING%';

-- Inteligência Financeira
update public.dim_cursos set grade_life = true
where curso_id ilike '%INTELIGÊNCIA FINANCEIRA%' and tipo = 'GGB';

-- Performance e Comportamento Humano
update public.dim_cursos set grade_life = true
where curso_id ilike '%PERFORMANCE E COMPORTAMENTO HUMANO%';

-- Alta Performance em Saúde
update public.dim_cursos set grade_life = true
where curso_id ilike '%ALTA PERFORMANCE EM SA%'
   or curso_id ilike '%ALTA PERFORMANCE EM SAÚDE%';

-- ---------- BUSINESS ----------
-- Método CIS (porta de entrada comum — também Business)
update public.dim_cursos set grade_business = true
where tipo = 'CIS';

-- ML5 - Business Coaching
update public.dim_cursos set grade_business = true
where curso_id ilike '%BUSINESS COACHING%' or curso_id ilike '%ML5%';

-- Business High Performance
update public.dim_cursos set grade_business = true
where curso_id ilike '%BUSINESS HIGH PERFORMANCE%';

-- Planejamento Estratégico
update public.dim_cursos set grade_business = true
where curso_id ilike '%PLANEJAMENTO ESTRAT%';

-- Growth
update public.dim_cursos set grade_business = true
where curso_id = 'GROWTH';

-- Oradores e Palestrantes no Mundo Business
update public.dim_cursos set grade_business = true
where curso_id ilike '%ORADORES E PALESTRANTES%';

-- conferência
-- select curso_id, grade_life, grade_business from dim_cursos
-- where grade_life or grade_business order by curso_id;

notify pgrst, 'reload schema';
