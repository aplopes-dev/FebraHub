-- ============================================================
-- FebraHub · Migration 74 — NPS de eventos (resposta individual via Make)
--
-- Eventos coletam resposta INDIVIDUAL por participante -> permite NPS
-- clássico (promotores 9-10 menos detratores 0-6). Tabela separada da
-- fato_avaliacao (que é média de turma dos GGB).
--
-- O Make envia uma linha por participante a cada resposta do formulário.
-- ============================================================

create table if not exists public.fato_avaliacao_evento (
  id                bigint generated always as identity primary key,
  evento            text not null,
  data_evento       date,
  nota_indicacao    int not null check (nota_indicacao between 0 and 10),  -- NPS individual
  -- notas de qualidade opcionais (se o form coletar)
  q_conteudo        int,
  q_clareza         int,
  q_material        int,
  comentario        text,
  criado_em         timestamptz default now()
);

create index if not exists idx_aval_evento on public.fato_avaliacao_evento (evento, data_evento);

-- NPS clássico por evento (promotores - detratores)
drop view if exists public.vw_pedagogico_nps_evento cascade;
create view public.vw_pedagogico_nps_evento as
with base as (
  select
    evento,
    count(*)                                            as respondentes,
    count(*) filter (where nota_indicacao >= 9)         as promotores,
    count(*) filter (where nota_indicacao between 7 and 8) as neutros,
    count(*) filter (where nota_indicacao <= 6)         as detratores,
    round(avg(nota_indicacao), 1)                       as media_indicacao,
    max(data_evento)                                    as ultimo_evento
  from public.fato_avaliacao_evento
  group by evento
)
select
  evento,
  respondentes,
  promotores,
  neutros,
  detratores,
  media_indicacao,
  -- NPS clássico: (% promotores - % detratores), escala -100 a +100
  round(100.0 * (promotores - detratores) / nullif(respondentes, 0), 0) as nps,
  ultimo_evento
from base
where public.pode_ver('pedagogico')
order by nps desc nulls last;
grant select on public.vw_pedagogico_nps_evento to authenticated;

-- KPI geral de NPS de eventos
drop view if exists public.vw_pedagogico_nps_evento_kpis cascade;
create view public.vw_pedagogico_nps_evento_kpis as
with base as (
  select
    count(*)                                            as respondentes,
    count(*) filter (where nota_indicacao >= 9)         as promotores,
    count(*) filter (where nota_indicacao <= 6)         as detratores
  from public.fato_avaliacao_evento
)
select
  respondentes,
  (select count(distinct evento) from public.fato_avaliacao_evento) as eventos,
  round(100.0 * (promotores - detratores) / nullif(respondentes, 0), 0) as nps_geral
from base
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_nps_evento_kpis to authenticated;

-- RLS
alter table public.fato_avaliacao_evento enable row level security;

drop policy if exists aval_evento_select on public.fato_avaliacao_evento;
create policy aval_evento_select on public.fato_avaliacao_evento
  for select using (public.pode_ver('pedagogico'));

-- insert liberado para service_role (o Make usa a service key) e gestora
drop policy if exists aval_evento_insert on public.fato_avaliacao_evento;
create policy aval_evento_insert on public.fato_avaliacao_evento
  for insert with check (true);   -- Make insere via service key; ajuste se quiser restringir

notify pgrst, 'reload schema';
