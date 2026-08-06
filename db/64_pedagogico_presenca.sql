-- ============================================================
-- FebraHub · Migration 64 — Presença / "comprou e não compareceu"
--
-- Cruza fato_base_alunos (quem comprou) com fato_credenciamento
-- (quem compareceu) por CPF (aluno_id) + turma. Os nomes de curso
-- são IDÊNTICOS nos dois lados — sem de-para necessário.
--
-- Regra: linha no credenciamento = compareceu. Quem comprou e não
-- está no credenciamento da turma = NÃO compareceu (alvo de reativação).
--
-- PROTEÇÃO DE COBERTURA: só considera turmas onde pelo menos 50% dos
-- matriculados aparecem no credenciamento. Turma sem credenciamento no
-- arquivo (cobertura ~0) NÃO gera "ausentes falsos" — evita listar como
-- faltante quem na verdade foi, mas cujo curso não credencia.
--
-- RESSALVA aluno_id: é CPF quando existe, e-mail quando falta CPF. Quem
-- comprou com e-mail (sem CPF) não casa com o credenciamento (que tem
-- CPF) e apareceria como falso ausente. A cobertura mínima mitiga isso.
-- PII (nome/celular/email) fica na tabela crua, nunca na view.
-- ============================================================

-- Cobertura de credenciamento por turma
drop view if exists public.vw_pedagogico_cobertura cascade;
create view public.vw_pedagogico_cobertura as
select
  a.turma,
  count(distinct a.aluno_id)                               as matriculados,
  count(distinct c.aluno_id)                               as compareceram,
  round(count(distinct c.aluno_id)::numeric
        / nullif(count(distinct a.aluno_id), 0), 2)        as cobertura
from public.fato_base_alunos a
left join public.fato_credenciamento c
  on c.aluno_id = a.aluno_id and c.turma = a.turma
where a.turma in (select distinct turma from public.fato_credenciamento)
group by a.turma;
grant select on public.vw_pedagogico_cobertura to authenticated;

-- Comparecimento por turma (para o hub) — só turmas com cobertura real
drop view if exists public.vw_pedagogico_comparecimento cascade;
create view public.vw_pedagogico_comparecimento as
select
  a.turma,
  split_part(a.turma, ' - ', 1)                            as ano_turma,
  max(a.curso_id)                                          as curso,
  count(distinct a.aluno_id)                               as matriculados,
  count(distinct c.aluno_id)                               as compareceram,
  count(distinct a.aluno_id) - count(distinct c.aluno_id)  as ausentes,
  round(100.0 * count(distinct c.aluno_id)
        / nullif(count(distinct a.aluno_id), 0), 1)        as taxa_comparecimento
from public.fato_base_alunos a
left join public.fato_credenciamento c
  on c.aluno_id = a.aluno_id and c.turma = a.turma
join public.vw_pedagogico_cobertura cov
  on cov.turma = a.turma and cov.cobertura >= 0.50
where public.pode_ver('pedagogico')
group by a.turma
order by a.turma;
grant select on public.vw_pedagogico_comparecimento to authenticated;

-- Comprou e NÃO compareceu (lista de reativação)
-- expõe curso, turma, consultor e valor — NÃO expõe PII
drop view if exists public.vw_pedagogico_ausentes cascade;
create view public.vw_pedagogico_ausentes as
select
  a.aluno_id,                       -- CPF (chave; a gestora cruza no Salesforce)
  a.turma,
  a.curso_id                        as curso,
  a.consultor_id                    as consultor,
  a.data_matricula,
  round(a.valor)                    as valor
from public.fato_base_alunos a
left join public.fato_credenciamento c
  on c.aluno_id = a.aluno_id and c.turma = a.turma
join public.vw_pedagogico_cobertura cov
  on cov.turma = a.turma and cov.cobertura >= 0.50
where c.aluno_id is null                       -- não compareceu
  and public.pode_ver('pedagogico')
order by a.data_matricula desc;
grant select on public.vw_pedagogico_ausentes to authenticated;

-- KPIs de presença (topo do hub)
drop view if exists public.vw_pedagogico_presenca_kpis cascade;
create view public.vw_pedagogico_presenca_kpis as
with base as (
  select
    a.aluno_id, a.turma,
    (c.aluno_id is not null) as compareceu
  from public.fato_base_alunos a
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  join public.vw_pedagogico_cobertura cov
    on cov.turma = a.turma and cov.cobertura >= 0.50
)
select
  count(*)                                          as matriculas_com_credenciamento,
  count(*) filter (where compareceu)                as compareceram,
  count(*) filter (where not compareceu)            as ausentes,
  round(100.0 * count(*) filter (where compareceu)
        / nullif(count(*), 0), 1)                   as taxa_comparecimento_geral,
  count(distinct turma)                             as turmas_cobertas
from base
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_presenca_kpis to authenticated;

notify pgrst, 'reload schema';
