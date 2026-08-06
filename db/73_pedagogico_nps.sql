-- ============================================================
-- FebraHub · Migration 73 — Avaliações / NPS (GGB manual + eventos via Make)
--
-- Uma linha por TURMA, com a média de cada pergunta (a gestora insere
-- conforme a planilha padrão). Fonte 'ggb' = manual; 'evento' = Make.
--
-- 8 notas (7 de qualidade + 1 de NPS-indicação, todas 0-10) + comentário.
-- O NPS de verdade sai da pergunta 8 (probabilidade de indicar).
-- Como é média da turma, o "NPS" aqui é a média da nota de indicação,
-- não o cálculo clássico de promotores-detratores (que exige nota
-- individual). Ver nota no fim.
-- ============================================================

create table if not exists public.fato_avaliacao (
  id                bigint generated always as identity primary key,
  fonte             text not null default 'ggb',    -- 'ggb' | 'evento'
  curso             text not null,
  treinador         text,
  data_curso        date not null,
  turma             text,
  respondentes      int,                            -- quantos responderam (opcional)
  -- as 7 perguntas de qualidade (média da turma, 0-10)
  q_conteudo        numeric(4,2),   -- conteúdo relevante / gerou transformação
  q_clareza         numeric(4,2),   -- abordagem e temas claros
  q_material        numeric(4,2),   -- qualidade do material didático
  q_aplicacao       numeric(4,2),   -- treinador aplicou ferramentas de forma clara
  q_dominio         numeric(4,2),   -- domínio do conteúdo e comunicação
  q_pontualidade    numeric(4,2),   -- pontual e organizado
  q_duvidas         numeric(4,2),   -- lidou com dúvidas/dificuldades
  -- pergunta 8: NPS (probabilidade de indicar, 0-10)
  nps               numeric(4,2),
  comentario        text,
  criado_em         timestamptz default now()
);

-- índice para consulta por curso/data
create index if not exists idx_avaliacao_curso on public.fato_avaliacao (curso, data_curso);

-- ---------- View de NPS por curso (para o hub) ----------
drop view if exists public.vw_pedagogico_nps cascade;
create view public.vw_pedagogico_nps as
select
  curso,
  treinador,
  count(*)                          as turmas_avaliadas,
  sum(respondentes)                 as respondentes,
  round(avg(q_conteudo), 1)         as media_conteudo,
  round(avg(q_clareza), 1)          as media_clareza,
  round(avg(q_material), 1)         as media_material,
  round(avg(q_aplicacao), 1)        as media_aplicacao,
  round(avg(q_dominio), 1)          as media_dominio,
  round(avg(q_pontualidade), 1)     as media_pontualidade,
  round(avg(q_duvidas), 1)          as media_duvidas,
  round(avg(nps), 1)                as media_nps,
  max(data_curso)                   as ultima_avaliacao
from public.fato_avaliacao
where public.pode_ver('pedagogico')
group by curso, treinador
order by media_nps desc nulls last;
grant select on public.vw_pedagogico_nps to authenticated;

-- ---------- View por treinador (desempenho do treinador) ----------
drop view if exists public.vw_pedagogico_nps_treinador cascade;
create view public.vw_pedagogico_nps_treinador as
select
  treinador,
  count(*)                          as turmas,
  round(avg(nps), 1)                as media_nps,
  round(avg((q_conteudo+q_clareza+q_material+q_aplicacao
             +q_dominio+q_pontualidade+q_duvidas)/7.0), 1) as media_geral_qualidade
from public.fato_avaliacao
where treinador is not null and public.pode_ver('pedagogico')
group by treinador
order by media_nps desc nulls last;
grant select on public.vw_pedagogico_nps_treinador to authenticated;

-- ---------- KPI geral de NPS ----------
drop view if exists public.vw_pedagogico_nps_kpis cascade;
create view public.vw_pedagogico_nps_kpis as
select
  count(*)                          as turmas_avaliadas,
  round(avg(nps), 1)                as media_nps_geral,
  round(avg((q_conteudo+q_clareza+q_material+q_aplicacao
             +q_dominio+q_pontualidade+q_duvidas)/7.0), 1) as media_qualidade_geral,
  count(distinct curso)             as cursos_avaliados,
  count(distinct treinador)         as treinadores_avaliados
from public.fato_avaliacao
where public.pode_ver('pedagogico');
grant select on public.vw_pedagogico_nps_kpis to authenticated;

-- RLS: a gestora do pedagógico insere e lê
alter table public.fato_avaliacao enable row level security;

drop policy if exists avaliacao_select on public.fato_avaliacao;
create policy avaliacao_select on public.fato_avaliacao
  for select using (public.pode_ver('pedagogico'));

drop policy if exists avaliacao_insert on public.fato_avaliacao;
create policy avaliacao_insert on public.fato_avaliacao
  for insert with check (public.pode_ver('pedagogico'));

drop policy if exists avaliacao_update on public.fato_avaliacao;
create policy avaliacao_update on public.fato_avaliacao
  for update using (public.pode_ver('pedagogico'));

drop policy if exists avaliacao_delete on public.fato_avaliacao;
create policy avaliacao_delete on public.fato_avaliacao
  for delete using (public.pode_ver('pedagogico'));

notify pgrst, 'reload schema';
