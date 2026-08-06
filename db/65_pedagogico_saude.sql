-- ============================================================
-- FebraHub · Migration 65 — Pedagógico: visão de saúde geral
--
-- Foco: acompanhamento da saúde do cliente ao longo do tempo, não
-- lista de reativação. Destaque para tendências e taxas.
-- ============================================================

-- 1) Evolução da taxa de comparecimento por período (a saúde no tempo)
drop view if exists public.vw_pedagogico_presenca_tempo cascade;
create view public.vw_pedagogico_presenca_tempo as
with base as (
  select
    -- ancora no tempo pela data da MATRÍCULA (todos têm); a data do
    -- credenciamento só existe para quem foi, e usá-la excluiria os
    -- ausentes, forçando 100% falso.
    date_trunc('quarter', a.data_matricula)::date as periodo,
    a.aluno_id, a.turma,
    (c.aluno_id is not null) as compareceu
  from public.fato_base_alunos a
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
  where a.data_matricula is not null
)
select
  periodo,
  count(*)                                            as matriculas,
  count(*) filter (where compareceu)                  as compareceram,
  round(100.0 * count(*) filter (where compareceu)
        / nullif(count(*), 0), 1)                     as taxa_comparecimento
from base
where public.pode_ver('pedagogico')
group by periodo
order by periodo;
grant select on public.vw_pedagogico_presenca_tempo to authenticated;

-- 2) Comparecimento por curso (quais cursos têm mais falta)
drop view if exists public.vw_pedagogico_presenca_curso cascade;
create view public.vw_pedagogico_presenca_curso as
with base as (
  select
    a.curso_id, a.aluno_id, a.turma,
    (c.aluno_id is not null) as compareceu
  from public.fato_base_alunos a
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
)
select
  curso_id                                            as curso,
  count(*)                                            as matriculas,
  count(*) filter (where compareceu)                  as compareceram,
  count(*) filter (where not compareceu)              as faltaram,
  round(100.0 * count(*) filter (where compareceu)
        / nullif(count(*), 0), 1)                     as taxa_comparecimento
from base
where public.pode_ver('pedagogico')
group by curso_id
having count(*) >= 20
order by taxa_comparecimento asc;   -- pior comparecimento no topo (alerta)
grant select on public.vw_pedagogico_presenca_curso to authenticated;

-- 3) Presença x recompra: quem falta, volta menos?
-- (conecta as duas seções — saúde de retenção)
drop view if exists public.vw_pedagogico_presenca_recompra cascade;
create view public.vw_pedagogico_presenca_recompra as
with compras as (
  select aluno_id, count(*) as total_compras
  from public.fato_base_alunos
  where aluno_id is not null and aluno_id <> ''
  group by aluno_id
),
presenca_aluno as (
  -- o aluno compareceu em pelo menos uma turma com credenciamento?
  select
    a.aluno_id,
    bool_or(c.aluno_id is not null) as ja_compareceu
  from public.fato_base_alunos a
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
  group by a.aluno_id
)
select
  case when p.ja_compareceu then 'Compareceu' else 'Nunca compareceu' end as grupo,
  count(*)                                            as alunos,
  round(avg(co.total_compras), 2)                     as media_compras,
  count(*) filter (where co.total_compras >= 2)       as recompraram,
  round(100.0 * count(*) filter (where co.total_compras >= 2)
        / nullif(count(*), 0), 1)                     as taxa_recompra
from presenca_aluno p
join compras co on co.aluno_id = p.aluno_id
where public.pode_ver('pedagogico')
group by p.ja_compareceu;
grant select on public.vw_pedagogico_presenca_recompra to authenticated;

notify pgrst, 'reload schema';
