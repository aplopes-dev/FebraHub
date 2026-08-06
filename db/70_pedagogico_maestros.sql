-- ============================================================
-- FebraHub · Migration 70 — Maestros (clientes de acompanhamento próximo)
--
-- Maestro = quem comprou o curso MAESTRIA. Grupo fixo (só entra).
-- É o ticket mais alto da unidade e precisa de acompanhamento de perto.
--
-- A gestora acompanha, por maestro: quanto comprou (total e nº de cursos),
-- se está comparecendo, se está ativo, e quando foi a última compra.
--
-- PII: aluno_id é CPF (chave para a gestora cruzar no Salesforce). Nome/
-- telefone/email NÃO entram — se a gestora precisa contatar, usa o CPF
-- no Salesforce. A view expõe comportamento, não dados pessoais.
-- ============================================================

-- quem é maestro: comprou o curso MAESTRIA
drop view if exists public.vw_pedagogico_maestros cascade;
create view public.vw_pedagogico_maestros as
with maestros as (
  select distinct aluno_id
  from public.fato_base_alunos
  where curso_id = 'MAESTRIA'
    and aluno_id is not null and aluno_id <> ''
),
-- histórico de compras de cada maestro (todos os cursos, não só a grade)
compras as (
  select
    a.aluno_id,
    count(*)                                    as total_cursos,
    round(sum(a.valor))                         as total_investido,
    max(a.data_matricula)                       as ultima_compra,
    min(a.data_matricula)                       as primeira_compra
  from public.fato_base_alunos a
  join maestros m on m.aluno_id = a.aluno_id
  group by a.aluno_id
),
-- comparecimento do maestro nas turmas com credenciamento
presenca as (
  select
    a.aluno_id,
    count(*) filter (where c.aluno_id is not null)  as compareceu,
    count(*) filter (where c.aluno_id is null)      as faltou
  from public.fato_base_alunos a
  join maestros m on m.aluno_id = a.aluno_id
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  where a.turma in (select distinct turma from public.fato_credenciamento)
  group by a.aluno_id
)
select
  co.aluno_id,
  co.total_cursos,
  co.total_investido,
  co.primeira_compra,
  co.ultima_compra,
  (current_date - co.ultima_compra)              as dias_sem_comprar,
  -- ativo = comprou nos últimos 12 meses
  (co.ultima_compra >= current_date - interval '12 months') as ativo,
  coalesce(pr.compareceu, 0)                     as aulas_compareceu,
  coalesce(pr.faltou, 0)                         as aulas_faltou,
  case when coalesce(pr.compareceu,0) + coalesce(pr.faltou,0) > 0
       then round(100.0 * pr.compareceu
            / (pr.compareceu + pr.faltou), 1) end as taxa_presenca
from compras co
left join presenca pr on pr.aluno_id = co.aluno_id
where public.pode_ver('pedagogico')
order by co.total_investido desc;
grant select on public.vw_pedagogico_maestros to authenticated;

-- KPIs do grupo de maestros (topo do painel)
drop view if exists public.vw_pedagogico_maestros_kpis cascade;
create view public.vw_pedagogico_maestros_kpis as
with maestros as (
  select distinct aluno_id from public.fato_base_alunos
  where curso_id = 'MAESTRIA' and aluno_id is not null and aluno_id <> ''
),
resumo as (
  select
    a.aluno_id,
    max(a.data_matricula) as ultima_compra
  from public.fato_base_alunos a
  join maestros m on m.aluno_id = a.aluno_id
  group by a.aluno_id
)
select
  count(*)                                        as total_maestros,
  count(*) filter (where ultima_compra >= current_date - interval '12 months') as ativos,
  count(*) filter (where ultima_compra < current_date - interval '12 months')  as inativos
from resumo
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_maestros_kpis to authenticated;

notify pgrst, 'reload schema';
