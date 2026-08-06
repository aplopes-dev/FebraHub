-- ============================================================
-- FebraHub · Migration 50 — Metas da loja (Sheets)
--
-- Fonte: abas METAS MENSAIS 2025 e 2026 da planilha da gestora.
-- Formato de origem: blocos visuais lado a lado (cada mês ocupa um
-- conjunto de colunas), com Máster/Básica/Mínima no topo e a lista
-- de cursos embaixo.
--
-- Só Salvador — as abas de 2024/2025 misturam Recife, que é filtrado.
--
-- Duas tabelas:
--   fato_loja_meta_mes   -> os três níveis por mês
--   fato_loja_meta_curso -> meta por curso dentro do mês
-- ============================================================

create table if not exists public.fato_loja_meta_mes (
  mes_ref       date primary key,
  ano           integer,
  mes_nome      text,
  master        numeric,
  basica        numeric,
  minima        numeric,
  atualizado_em timestamptz default now()
);
grant select on public.fato_loja_meta_mes to authenticated;

create table if not exists public.fato_loja_meta_curso (
  mes_ref       date not null,
  curso         text not null,
  meta_produtos numeric,
  meta_curso    numeric,
  meta_total    numeric,
  alunos        integer,
  atualizado_em timestamptz default now(),
  primary key (mes_ref, curso)
);
grant select on public.fato_loja_meta_curso to authenticated;

-- ---------- Realizado x meta por mês ----------
drop view if exists public.vw_loja_meta_realizado cascade;
create view public.vw_loja_meta_realizado as
select
  m.mes_ref,
  m.ano,
  m.mes_nome,
  m.master,
  m.basica,
  m.minima,
  round(coalesce(r.receita,0))                    as realizado,
  case when m.minima > 0
       then round(100.0 * coalesce(r.receita,0) / m.minima, 1) end as pct_minima,
  case when m.basica > 0
       then round(100.0 * coalesce(r.receita,0) / m.basica, 1) end as pct_basica,
  case when m.master > 0
       then round(100.0 * coalesce(r.receita,0) / m.master, 1) end as pct_master,
  case
    when coalesce(r.receita,0) >= m.master then 'Máster'
    when coalesce(r.receita,0) >= m.basica then 'Básica'
    when coalesce(r.receita,0) >= m.minima then 'Mínima'
    else 'Abaixo'
  end                                             as nivel_atingido
from public.fato_loja_meta_mes m
left join (
  -- realizado vem do Omie (receita oficial da loja)
  select date_trunc('month', data_emissao)::date as mes, sum(valor) as receita
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
  group by 1
) r on r.mes = m.mes_ref
where public.pode_ver('loja')
order by m.mes_ref;
grant select on public.vw_loja_meta_realizado to authenticated;

-- ---------- Meta x realizado por curso ----------
drop view if exists public.vw_loja_meta_curso cascade;
create view public.vw_loja_meta_curso as
select
  coalesce(mc.mes_ref, pc.mes_ref)        as mes_ref,
  coalesce(mc.curso, pc.curso)            as curso,
  mc.meta_produtos,
  mc.meta_total,
  mc.alunos                               as alunos_meta,
  pc.alunos                               as alunos_real,
  pc.faturamento                          as realizado,
  case when coalesce(mc.meta_produtos,0) > 0
       then round(100.0 * coalesce(pc.faturamento,0) / mc.meta_produtos, 1) end as pct_meta
from public.fato_loja_meta_curso mc
full join public.vw_loja_performance_curso pc
  on pc.mes_ref = mc.mes_ref and upper(trim(pc.curso)) = upper(trim(mc.curso))
where public.pode_ver('loja');
grant select on public.vw_loja_meta_curso to authenticated;

notify pgrst, 'reload schema';
