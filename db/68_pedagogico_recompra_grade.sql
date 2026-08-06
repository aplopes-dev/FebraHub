-- ============================================================
-- FebraHub · Migration 68 — Recompra filtrada pela grade pedagógica
--
-- Recompra medida SÓ sobre cursos da grade (19 CIS + 12 GGB), coerente
-- com o resto do hub. "Quem faz nossos cursos volta a fazer nossos cursos."
-- ============================================================

-- KPIs de recompra (só grade)
drop view if exists public.vw_pedagogico_kpis cascade;
create view public.vw_pedagogico_kpis as
with por_aluno as (
  select a.aluno_id, count(*) as compras
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  where a.aluno_id is not null and a.aluno_id <> ''
  group by a.aluno_id
)
select
  count(*)                                         as alunos_unicos,
  sum(compras)                                     as matriculas_total,
  round(avg(compras), 2)                           as cursos_por_aluno,
  count(*) filter (where compras >= 2)             as alunos_recompra,
  round(100.0 * count(*) filter (where compras >= 2)
        / nullif(count(*), 0), 1)                  as taxa_recompra,
  count(*) filter (where compras >= 5)             as alunos_fieis,
  max(compras)                                     as max_compras
from por_aluno
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_kpis to authenticated;

-- Distribuição por nº de compras na grade
drop view if exists public.vw_pedagogico_frequencia cascade;
create view public.vw_pedagogico_frequencia as
with por_aluno as (
  select a.aluno_id, count(*) as compras
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  where a.aluno_id is not null and a.aluno_id <> ''
  group by a.aluno_id
)
select
  case when compras >= 10 then '10+' else compras::text end as faixa_compras,
  min(compras) as ordem,
  count(*) as alunos
from por_aluno
where public.pode_ver('pedagogico')
group by 1 order by 2;
grant select on public.vw_pedagogico_frequencia to authenticated;

-- Recompra por curso da grade (qual curso mais leva a outro da grade)
drop view if exists public.vw_pedagogico_recompra_curso cascade;
create view public.vw_pedagogico_recompra_curso as
with compras_grade as (
  select a.aluno_id, count(*) as total
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  where a.aluno_id is not null and a.aluno_id <> ''
  group by a.aluno_id
)
select
  a.curso_id                                       as curso,
  count(distinct a.aluno_id)                       as alunos,
  count(distinct a.aluno_id) filter (where cg.total >= 2) as recompraram,
  round(100.0 * count(distinct a.aluno_id) filter (where cg.total >= 2)
        / nullif(count(distinct a.aluno_id), 0), 1) as taxa_recompra
from public.fato_base_alunos a
join public.dim_cursos cur
  on cur.curso_id = a.curso_id and cur.grade_pedagogico
join compras_grade cg on cg.aluno_id = a.aluno_id
where a.aluno_id is not null and a.aluno_id <> ''
  and public.pode_ver('pedagogico')
group by a.curso_id
having count(distinct a.aluno_id) >= 10
order by alunos desc;
grant select on public.vw_pedagogico_recompra_curso to authenticated;

-- Presença x recompra (só grade)
drop view if exists public.vw_pedagogico_presenca_recompra cascade;
create view public.vw_pedagogico_presenca_recompra as
with compras as (
  select a.aluno_id, count(*) as total
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  where a.aluno_id is not null and a.aluno_id <> ''
  group by a.aluno_id
),
presenca_aluno as (
  select a.aluno_id, bool_or(c.aluno_id is not null) as ja_compareceu
  from public.fato_base_alunos a
  join public.dim_cursos cur
    on cur.curso_id = a.curso_id and cur.grade_pedagogico
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
  group by a.aluno_id
)
select
  case when p.ja_compareceu then 'Compareceu' else 'Nunca compareceu' end as grupo,
  count(*) as alunos,
  round(avg(co.total), 2) as media_compras,
  round(100.0 * count(*) filter (where co.total >= 2) / nullif(count(*),0), 1) as taxa_recompra
from presenca_aluno p
join compras co on co.aluno_id = p.aluno_id
where public.pode_ver('pedagogico')
group by p.ja_compareceu;
grant select on public.vw_pedagogico_presenca_recompra to authenticated;

notify pgrst, 'reload schema';
