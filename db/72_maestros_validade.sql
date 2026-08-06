-- ============================================================
-- FebraHub · Migration 72 — Validade da Maestria (12 meses)
--
-- A Maestria vale 12 meses a partir da COMPRA do curso MAESTRIA.
-- Status: Válido / Perto de vencer (<=60 dias) / Vencido.
--
-- Recria vw_pedagogico_maestros_detalhe adicionando:
--   data_maestria     — quando comprou o curso MAESTRIA
--   vence_em          — data_maestria + 12 meses
--   dias_para_vencer  — quanto falta (negativo se vencido)
--   status_maestria   — Válido / Perto de vencer / Vencido
-- ============================================================

drop view if exists public.vw_pedagogico_maestros_detalhe cascade;
create view public.vw_pedagogico_maestros_detalhe as
with maestros as (
  select
    aluno_id,
    max(data_matricula) as data_maestria   -- a compra da MAESTRIA (a mais recente, se recomprou)
  from public.fato_base_alunos
  where curso_id = 'MAESTRIA' and aluno_id is not null and aluno_id <> ''
  group by aluno_id
),
contato as (
  select distinct on (a.aluno_id)
    a.aluno_id, a.email_cliente, a.telefone_cliente, a.consultor_id
  from public.fato_base_alunos a
  join maestros m on m.aluno_id = a.aluno_id
  where a.email_cliente is not null or a.telefone_cliente is not null
  order by a.aluno_id, a.data_matricula desc nulls last
),
compras as (
  select
    a.aluno_id,
    count(*) as total_cursos,
    round(sum(a.valor)) as total_investido,
    max(a.data_matricula) as ultima_compra,
    min(a.data_matricula) as primeira_compra
  from public.fato_base_alunos a
  join maestros m on m.aluno_id = a.aluno_id
  group by a.aluno_id
),
presenca as (
  select
    a.aluno_id,
    count(*) filter (where c.aluno_id is not null) as compareceu,
    count(*) filter (where c.aluno_id is null) as faltou
  from public.fato_base_alunos a
  join maestros m on m.aluno_id = a.aluno_id
  left join public.fato_credenciamento c
    on c.aluno_id = a.aluno_id and c.turma = a.turma
  where a.turma in (select distinct turma from public.fato_credenciamento)
  group by a.aluno_id
)
select
  co.aluno_id                                    as cpf,
  coalesce(
    da.nome,
    case when co.aluno_id like 'pj:%'
         then replace(substr(co.aluno_id, 4), '_', ' ') end
  )                                              as nome,
  ct.email_cliente                               as email,
  ct.telefone_cliente                            as telefone,
  ct.consultor_id                                as consultor,
  co.total_cursos,
  co.total_investido,
  co.primeira_compra,
  co.ultima_compra,
  (current_date - co.ultima_compra)              as dias_sem_comprar,
  (co.ultima_compra >= current_date - interval '12 months') as ativo,
  coalesce(pr.compareceu, 0)                     as aulas_compareceu,
  coalesce(pr.faltou, 0)                         as aulas_faltou,
  case when coalesce(pr.compareceu,0)+coalesce(pr.faltou,0) > 0
       then round(100.0*pr.compareceu/(pr.compareceu+pr.faltou),1) end as taxa_presenca,
  -- VALIDADE DA MAESTRIA
  m.data_maestria,
  (m.data_maestria + interval '12 months')::date as vence_em,
  ((m.data_maestria + interval '12 months')::date - current_date) as dias_para_vencer,
  case
    when (m.data_maestria + interval '12 months')::date < current_date
      then 'Vencido'
    when (m.data_maestria + interval '12 months')::date <= current_date + 60
      then 'Perto de vencer'
    else 'Válido'
  end                                            as status_maestria
from compras co
join maestros m on m.aluno_id = co.aluno_id
left join contato ct on ct.aluno_id = co.aluno_id
left join presenca pr on pr.aluno_id = co.aluno_id
left join public.dim_alunos da
  on lpad(regexp_replace(da.cpf, '\D', '', 'g'), 11, '0')
   = lpad(regexp_replace(co.aluno_id, '\D', '', 'g'), 11, '0')
  and co.aluno_id not like 'pj:%'
where public.pode_ver('pedagogico')
order by co.total_investido desc;
grant select on public.vw_pedagogico_maestros_detalhe to authenticated;

-- KPIs com contagem por status de validade
drop view if exists public.vw_pedagogico_maestros_kpis cascade;
create view public.vw_pedagogico_maestros_kpis as
with maestros as (
  select aluno_id, max(data_matricula) as data_maestria
  from public.fato_base_alunos
  where curso_id = 'MAESTRIA' and aluno_id is not null and aluno_id <> ''
  group by aluno_id
)
select
  count(*) as total_maestros,
  count(*) filter (where (data_maestria + interval '12 months')::date >= current_date) as validos,
  count(*) filter (where (data_maestria + interval '12 months')::date < current_date)  as vencidos,
  count(*) filter (where (data_maestria + interval '12 months')::date >= current_date
                     and (data_maestria + interval '12 months')::date <= current_date + 60) as perto_vencer
from maestros
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_maestros_kpis to authenticated;

notify pgrst, 'reload schema';
