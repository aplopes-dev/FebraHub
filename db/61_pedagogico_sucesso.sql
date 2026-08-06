-- ============================================================
-- FebraHub · Migration 61 — Hub Pedagógico / Sucesso do Cliente
--
-- O Salesforce NÃO tem: data_conclusao (0%), fase (0%),
-- status útil (100% "Aprovada"). Então conclusão, evasão e fase
-- não são mensuráveis — não inventar esses indicadores.
--
-- O que o dado SUSTENTA: RECOMPRA. Cada aluno pode ter várias
-- matrículas. 10.129 alunos únicos, 47% com 2+ compras. Esse é o
-- coração de "sucesso do cliente" — retenção, não conclusão.
--
-- RESSALVA: aluno_id é CPF quando existe, e-mail quando falta CPF.
-- Uma pessoa com CPF numa compra e e-mail em outra é contada como
-- dois alunos, o que SUBESTIMA a recompra. O número real é um piso.
-- ============================================================

-- ---------- KPIs gerais de recompra ----------
drop view if exists public.vw_pedagogico_kpis cascade;
create view public.vw_pedagogico_kpis as
with por_aluno as (
  select aluno_id, count(*) as compras
  from public.fato_base_alunos
  where aluno_id is not null and aluno_id <> ''
  group by aluno_id
)
select
  count(*)                                              as alunos_unicos,
  sum(compras)                                          as matriculas_total,
  round(avg(compras), 2)                               as cursos_por_aluno,
  count(*) filter (where compras >= 2)                 as alunos_recompra,
  round(100.0 * count(*) filter (where compras >= 2)
        / nullif(count(*), 0), 1)                      as taxa_recompra,
  count(*) filter (where compras >= 5)                 as alunos_fieis,
  max(compras)                                         as max_compras
from por_aluno
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_kpis to authenticated;

-- ---------- Distribuição por número de compras ----------
drop view if exists public.vw_pedagogico_frequencia cascade;
create view public.vw_pedagogico_frequencia as
with por_aluno as (
  select aluno_id, count(*) as compras
  from public.fato_base_alunos
  where aluno_id is not null and aluno_id <> ''
  group by aluno_id
)
select
  case when compras >= 10 then '10+' else compras::text end as faixa_compras,
  min(compras) as ordem,
  count(*) as alunos
from por_aluno
where public.pode_ver('pedagogico')
group by 1
order by 2;
grant select on public.vw_pedagogico_frequencia to authenticated;

-- ---------- Recompra por curso (qual curso mais retém) ----------
-- Para cada curso, quantos dos alunos que o fizeram voltaram a comprar
-- OUTRO curso depois.
drop view if exists public.vw_pedagogico_recompra_curso cascade;
create view public.vw_pedagogico_recompra_curso as
with compras_aluno as (
  select aluno_id, count(*) as total_compras
  from public.fato_base_alunos
  where aluno_id is not null and aluno_id <> ''
  group by aluno_id
)
select
  cur.tipo                                             as categoria,
  coalesce(cur.nome_curso, m.curso_id)                 as curso,
  count(distinct m.aluno_id)                           as alunos,
  count(distinct m.aluno_id) filter (where ca.total_compras >= 2) as alunos_que_recompraram,
  round(100.0 * count(distinct m.aluno_id) filter (where ca.total_compras >= 2)
        / nullif(count(distinct m.aluno_id), 0), 1)    as taxa_recompra
from public.fato_base_alunos m
join compras_aluno ca on ca.aluno_id = m.aluno_id
left join public.dim_cursos cur on cur.curso_id = m.curso_id
where m.aluno_id is not null and m.aluno_id <> ''
  and public.pode_ver('pedagogico')
group by 1, 2
having count(distinct m.aluno_id) >= 10
order by alunos desc;
grant select on public.vw_pedagogico_recompra_curso to authenticated;

-- ---------- Evolução mensal de matrículas ----------
drop view if exists public.vw_pedagogico_mensal cascade;
create view public.vw_pedagogico_mensal as
select
  date_trunc('month', data_matricula)::date as mes,
  count(*)                                   as matriculas,
  count(distinct aluno_id)                   as alunos_distintos
from public.fato_base_alunos
where data_matricula is not null
  and public.pode_ver('pedagogico')
group by 1
order by 1;
grant select on public.vw_pedagogico_mensal to authenticated;

notify pgrst, 'reload schema';
