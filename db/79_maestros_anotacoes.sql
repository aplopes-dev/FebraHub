-- ============================================================
-- FebraHub · Migration 79 — Anotações editáveis dos maestros
--
-- A gestora insere informações próprias sobre cada maestro (apelido,
-- empresa, faturamento, observações). Tabela complementar editável,
-- ligada ao maestro por CPF (aluno_id).
-- ============================================================

create table if not exists public.maestro_anotacao (
  aluno_id      text primary key,      -- CPF do maestro (chave)
  apelido       text,
  empresa       text,
  faturamento   numeric(14,2),         -- faturamento da empresa do maestro (número, permite somar/ordenar)
  cargo         text,
  observacoes   text,
  atualizado_em timestamptz default now()
);

-- RLS: só a gestora do pedagógico lê e edita
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

-- View que junta o painel de maestros (mig 72) com as anotações da gestora
drop view if exists public.vw_pedagogico_maestros_completo cascade;
create view public.vw_pedagogico_maestros_completo as
select
  m.*,
  a.apelido,
  a.empresa,
  a.faturamento,
  a.cargo         as cargo_anotado,
  a.observacoes
from public.vw_pedagogico_maestros_detalhe m
left join public.maestro_anotacao a on a.aluno_id = m.cpf;
grant select on public.vw_pedagogico_maestros_completo to authenticated;

notify pgrst, 'reload schema';

-- ============================================================
-- Complemento: campo nota_treinador na fato_avaliacao (para o GGB)
-- A "NOTA DA TREINADORA: 9,9" do bloco colado é distinta da nota de
-- indicação dos alunos — campo próprio.
-- ============================================================
alter table public.fato_avaliacao
  add column if not exists nota_treinador numeric(4,2);

notify pgrst, 'reload schema';
