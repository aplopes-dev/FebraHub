-- ============================================================
-- FebraHub · Migration 82 — Base de retenção + ajuste maestro
--
-- 1. Base de retenção: a gestora registra cada caso de cancelamento e o
--    desfecho da ligação (retido ou cancelado). Entrada manual.
-- 2. Renomeia 'apelido' -> como_gosta_ser_chamado na anotação do maestro.
-- ============================================================

-- 1. BASE DE RETENÇÃO
create table if not exists public.fato_retencao (
  id                bigint generated always as identity primary key,
  nome_cliente      text not null,
  curso             text,
  motivo_cancelamento text,
  data_ligacao      date,
  desfecho          text check (desfecho in ('retido', 'cancelado')),
  observacoes       text,
  registrado_por    text,
  criado_em         timestamptz default now()
);

-- RLS: só a gestora do pedagógico
alter table public.fato_retencao enable row level security;

drop policy if exists retencao_select on public.fato_retencao;
create policy retencao_select on public.fato_retencao
  for select using (public.pode_ver('pedagogico'));

drop policy if exists retencao_insert on public.fato_retencao;
create policy retencao_insert on public.fato_retencao
  for insert with check (public.pode_ver('pedagogico'));

drop policy if exists retencao_update on public.fato_retencao;
create policy retencao_update on public.fato_retencao
  for update using (public.pode_ver('pedagogico'));

drop policy if exists retencao_delete on public.fato_retencao;
create policy retencao_delete on public.fato_retencao
  for delete using (public.pode_ver('pedagogico'));

-- View com KPIs de retenção (taxa de sucesso da equipe)
drop view if exists public.vw_pedagogico_retencao cascade;
create view public.vw_pedagogico_retencao as
select
  count(*)                                          as total_casos,
  count(*) filter (where desfecho = 'retido')       as retidos,
  count(*) filter (where desfecho = 'cancelado')    as cancelados,
  round(100.0 * count(*) filter (where desfecho = 'retido')
        / nullif(count(*) filter (where desfecho is not null), 0), 1) as taxa_retencao
from public.fato_retencao
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_retencao to authenticated;

-- Motivos de cancelamento mais frequentes (o que mais faz cancelar)
drop view if exists public.vw_pedagogico_retencao_motivos cascade;
create view public.vw_pedagogico_retencao_motivos as
select
  coalesce(nullif(trim(motivo_cancelamento), ''), 'Não informado') as motivo,
  count(*)                                          as casos,
  count(*) filter (where desfecho = 'retido')       as retidos,
  count(*) filter (where desfecho = 'cancelado')    as cancelados
from public.fato_retencao
where public.pode_ver('pedagogico')
group by 1
order by casos desc;
grant select on public.vw_pedagogico_retencao_motivos to authenticated;

-- 2. MAESTRO: garantir a tabela e a coluna com o nome novo.
-- (à prova de estado: cria a tabela se não existir, e resolve o nome da
--  coluna seja qual for o estado atual — apelido, ausente, ou já renomeada)
create table if not exists public.maestro_anotacao (
  aluno_id      text primary key,
  empresa       text,
  faturamento   numeric(14,2),
  cargo         text,
  observacoes   text,
  atualizado_em timestamptz default now()
);

do $$
begin
  -- se existe 'apelido', renomeia para o nome novo
  if exists (select 1 from information_schema.columns
             where table_name='maestro_anotacao' and column_name='apelido') then
    alter table public.maestro_anotacao rename column apelido to como_gosta_ser_chamado;
  end if;
  -- garante a coluna com o nome novo (se não veio de rename nem já existia)
  if not exists (select 1 from information_schema.columns
                 where table_name='maestro_anotacao' and column_name='como_gosta_ser_chamado') then
    alter table public.maestro_anotacao add column como_gosta_ser_chamado text;
  end if;
end $$;

-- RLS da tabela (idempotente)
alter table public.maestro_anotacao enable row level security;
drop policy if exists maestro_anot_select on public.maestro_anotacao;
create policy maestro_anot_select on public.maestro_anotacao
  for select using (public.pode_ver('pedagogico'));
drop policy if exists maestro_anot_insert on public.maestro_anotacao;
create policy maestro_anot_insert on public.maestro_anotacao
  for insert with check (public.pode_ver('pedagogico'));
drop policy if exists maestro_anot_update on public.maestro_anotacao;
create policy maestro_anot_update on public.maestro_anotacao
  for update using (public.pode_ver('pedagogico'));

-- recriar a view completa dos maestros com o novo nome
drop view if exists public.vw_pedagogico_maestros_completo cascade;
create view public.vw_pedagogico_maestros_completo as
select
  m.*,
  a.como_gosta_ser_chamado,
  a.empresa,
  a.faturamento,
  a.cargo         as cargo_anotado,
  a.observacoes
from public.vw_pedagogico_maestros_detalhe m
left join public.maestro_anotacao a on a.aluno_id = m.cpf;
grant select on public.vw_pedagogico_maestros_completo to authenticated;

notify pgrst, 'reload schema';
