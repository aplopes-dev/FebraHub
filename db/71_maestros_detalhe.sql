-- ============================================================
-- FebraHub · Migration 71 — Maestros: detalhamento com identificação
--
-- Os 33 maestros são acompanhados INDIVIDUALMENTE pela gestora (clientes
-- de altíssimo valor, ~R$86k e ~10 cursos cada). Para esse trabalho ela
-- precisa saber QUEM são — nome e contato. É exceção justificada à regra
-- de não expor PII: grupo pequeno, acompanhamento nominal, razão de negócio.
--
-- A view fica restrita a pode_ver('pedagogico') — só a gestora do setor
-- acessa. Nome/telefone/email vêm da fato_base_alunos (a mais recente por
-- aluno). Continua sem expor CPF completo em tela (fica como chave).
-- ============================================================

drop view if exists public.vw_pedagogico_maestros_detalhe cascade;
create view public.vw_pedagogico_maestros_detalhe as
with maestros as (
  select distinct aluno_id
  from public.fato_base_alunos
  where curso_id = 'MAESTRIA' and aluno_id is not null and aluno_id <> ''
),
-- dados de contato mais recentes de cada maestro
contato as (
  select distinct on (a.aluno_id)
    a.aluno_id,
    a.email_cliente,
    a.telefone_cliente,
    a.consultor_id
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
  -- nome: da dim_alunos por CPF normalizado; para PJ, a razão social do id
  coalesce(
    da.nome,
    case when co.aluno_id like 'pj:%'
         then replace(replace(substr(co.aluno_id, 4), '_', ' '), '  ', ' ')
    end
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
       then round(100.0*pr.compareceu/(pr.compareceu+pr.faltou),1) end as taxa_presenca
from compras co
left join contato ct on ct.aluno_id = co.aluno_id
left join presenca pr on pr.aluno_id = co.aluno_id
-- casa por CPF normalizado com zeros à esquerda (lpad 11): a dim_alunos
-- guarda alguns CPFs sem os zeros iniciais, o que sem o lpad deixava 17
-- maestros sem nome. lpad nos dois lados resolve.
left join public.dim_alunos da
  on lpad(regexp_replace(da.cpf, '\D', '', 'g'), 11, '0')
   = lpad(regexp_replace(co.aluno_id, '\D', '', 'g'), 11, '0')
  and co.aluno_id not like 'pj:%'
where public.pode_ver('pedagogico')
order by co.total_investido desc;
grant select on public.vw_pedagogico_maestros_detalhe to authenticated;

notify pgrst, 'reload schema';
