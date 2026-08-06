-- ============================================================
-- FebraHub · Migration 67 — Views pedagógicas filtradas pela grade
--
-- Presença e comparecimento passam a considerar SÓ os cursos da grade
-- pedagógica (dim_cursos.grade_pedagogico = true): 19 CIS + 12 GGB.
-- Remove eventos, passes, bônus e GGB de outras unidades.
--
-- A recompra fica em duas versões: ver nota no fim.
-- ============================================================

-- Cobertura: só turmas de cursos da grade
drop view if exists public.vw_pedagogico_cobertura cascade;
create view public.vw_pedagogico_cobertura as
select
  a.turma,
  count(distinct a.aluno_id)                               as matriculados,
  count(distinct c.aluno_id)                               as compareceram,
  round(count(distinct c.aluno_id)::numeric
        / nullif(count(distinct a.aluno_id), 0), 2)        as cobertura
from public.fato_base_alunos a
join public.dim_cursos cur
  on cur.curso_id = a.curso_id and cur.grade_pedagogico    -- só a grade
left join public.fato_credenciamento c
  on c.aluno_id = a.aluno_id and c.turma = a.turma
where a.turma in (select distinct turma from public.fato_credenciamento)
group by a.turma;
grant select on public.vw_pedagogico_cobertura to authenticated;

-- Comparecimento por curso (só grade, piores no topo)
drop view if exists public.vw_pedagogico_presenca_curso cascade;
create view public.vw_pedagogico_presenca_curso as
with base as (
  select a.curso_id, a.aluno_id, a.turma, (c.aluno_id is not null) as compareceu
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
)
select
  curso_id as curso,
  count(*) as matriculas,
  count(*) filter (where compareceu) as compareceram,
  count(*) filter (where not compareceu) as faltaram,
  round(100.0 * count(*) filter (where compareceu) / nullif(count(*),0), 1) as taxa_comparecimento
from base
where public.pode_ver('pedagogico')
group by curso_id
having count(*) >= 20
order by taxa_comparecimento asc;
grant select on public.vw_pedagogico_presenca_curso to authenticated;

-- KPIs de presença (só grade)
drop view if exists public.vw_pedagogico_presenca_kpis cascade;
create view public.vw_pedagogico_presenca_kpis as
with base as (
  select a.aluno_id, a.turma, (c.aluno_id is not null) as compareceu
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
)
select
  count(*) as matriculas_com_credenciamento,
  count(*) filter (where compareceu) as compareceram,
  count(*) filter (where not compareceu) as ausentes,
  round(100.0 * count(*) filter (where compareceu) / nullif(count(*),0), 1) as taxa_comparecimento_geral,
  count(distinct turma) as turmas_cobertas
from base
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_presenca_kpis to authenticated;

-- Evolução no tempo (só grade, ancorada na data_matricula)
drop view if exists public.vw_pedagogico_presenca_tempo cascade;
create view public.vw_pedagogico_presenca_tempo as
with base as (
  select date_trunc('quarter', a.data_matricula)::date as periodo,
         a.aluno_id, a.turma, (c.aluno_id is not null) as compareceu
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
  where a.data_matricula is not null
)
select periodo,
  count(*) as matriculas,
  count(*) filter (where compareceu) as compareceram,
  round(100.0 * count(*) filter (where compareceu) / nullif(count(*),0), 1) as taxa_comparecimento
from base
where public.pode_ver('pedagogico')
group by periodo order by periodo;
grant select on public.vw_pedagogico_presenca_tempo to authenticated;

-- Ausentes (só grade)
drop view if exists public.vw_pedagogico_ausentes cascade;
create view public.vw_pedagogico_ausentes as
select a.aluno_id, a.turma, a.curso_id as curso, a.consultor_id as consultor,
       a.data_matricula, round(a.valor) as valor
from public.fato_base_alunos a
join public.dim_cursos cur
  on cur.curso_id = a.curso_id and cur.grade_pedagogico
left join public.fato_credenciamento c
  on c.aluno_id = a.aluno_id and c.turma = a.turma
join public.vw_pedagogico_cobertura cov
  on cov.turma = a.turma and cov.cobertura >= 0.50
where c.aluno_id is null
  and public.pode_ver('pedagogico')
order by a.data_matricula desc;
grant select on public.vw_pedagogico_ausentes to authenticated;

notify pgrst, 'reload schema';
