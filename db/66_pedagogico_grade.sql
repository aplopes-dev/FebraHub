-- ============================================================
-- FebraHub · Migration 66 — Grade pedagógica (filtro do hub)
--
-- O Pedagógico só acompanha os cursos ENTREGUES pela unidade:
-- os 12 GGB da grade local + todos os CIS. Os outros ~68 GGB são
-- de outras unidades/holding e não entram.
--
-- Marca a grade com uma flag em dim_cursos, e as views de presença/
-- recompra passam a filtrar por ela.
-- ============================================================

-- flag na dim_cursos
alter table public.dim_cursos
  add column if not exists grade_pedagogico boolean default false;

-- CIS: todos os 19
update public.dim_cursos set grade_pedagogico = true where tipo = 'CIS';

-- GGB da grade local (os 12 confirmados pela gestora)
update public.dim_cursos set grade_pedagogico = true
where tipo = 'GGB' and curso_id in (
  'TÉCNICAS DE VENDAS',
  'PLANEJAMENTO ESTRATÉGICO NA PRATICA',
  'MASTER COACHING',
  'MAESTRIA',
  'INTELIGÊNCIA FINANCEIRA',
  'GROWTH',
  'FORMAÇÃO PROFISSIONAL EM BUSINESS COACHING - ML5',
  'FORMAÇÃO INTERNACIONAL EM COACHING INTEGRAL SISTÊMICO',
  'FORMAÇÃO EM PERFORMANCE E COMPORTAMENTO HUMANO',
  'FORMAÇÃO EM COACHING INTEGRAL SISTÊMICO',
  'Formação de Oradores e Palestrantes no Mundo Business',
  'BUSINESS HIGH PERFORMANCE'
);

-- conferência: quantos ficaram marcados
-- select tipo, count(*) from public.dim_cursos where grade_pedagogico group by tipo;

notify pgrst, 'reload schema';
