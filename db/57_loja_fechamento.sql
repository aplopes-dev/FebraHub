-- ============================================================
-- FebraHub · Migration 57 — Fechamento oficial da loja (planilha)
--
-- Fonte: planilha "FECHAMENTO MES/ META" (1d5CRf_SM...), abas
-- META BATIDA 2022-2023-2024 / 2025 / 2026.
--
-- Cada mês é um bloco:
--   META <MÊS> <ANO>: MINIMA / BASICA / MASTER   (colunas 0-1)
--   FATURAMENTO LOJA: DESCRIÇÃO | VALOR          (colunas 3-4)
--     LOJA        32.073,10
--     PDA : 6      5.382,00
--     -> valor fechado = 37.455,10
--
-- Esta é a fonte OFICIAL de fechamento da loja, usada pela gestora.
-- Substitui as metas carregadas da outra planilha (que divergiam:
-- jan/2026 aparecia como R$200 mil lá e R$50 mil aqui).
-- ============================================================

create table if not exists public.fato_loja_fechamento (
  mes_ref        date primary key,
  ano            integer,
  mes_nome       text,
  faturamento    numeric,        -- soma das linhas de descrição
  meta_minima    numeric,
  meta_basica    numeric,
  meta_master    numeric,
  detalhe        jsonb,          -- {"LOJA": 32073.10, "PDA : 6": 5382.00}
  atualizado_em  timestamptz default now()
);
grant select on public.fato_loja_fechamento to authenticated;

-- Realizado x meta pelo fechamento oficial
drop view if exists public.vw_loja_fechamento cascade;
create view public.vw_loja_fechamento as
select
  mes_ref, ano, mes_nome,
  round(faturamento)  as faturamento,
  meta_minima, meta_basica, meta_master,
  case when coalesce(meta_minima,0) > 0
       then round(100.0 * faturamento / meta_minima, 1) end as pct_minima,
  case
    when coalesce(meta_minima,0)=0 and coalesce(meta_basica,0)=0
     and coalesce(meta_master,0)=0                            then 'Sem meta'
    when coalesce(meta_master,0) > 0 and faturamento >= meta_master then 'Máster'
    when coalesce(meta_basica,0) > 0 and faturamento >= meta_basica then 'Básica'
    when coalesce(meta_minima,0) > 0 and faturamento >= meta_minima then 'Mínima'
    else 'Abaixo'
  end as nivel_atingido,
  round(case
    when coalesce(meta_master,0) > 0 and faturamento >= meta_master then null
    when coalesce(meta_basica,0) > 0 and faturamento >= meta_basica then meta_master - faturamento
    when coalesce(meta_minima,0) > 0 and faturamento >= meta_minima then meta_basica - faturamento
    else meta_minima - faturamento
  end) as falta_proximo,
  detalhe,
  (mes_ref = date_trunc('month', current_date)::date) as em_curso
from public.fato_loja_fechamento
where public.pode_ver('loja')
order by mes_ref;
grant select on public.vw_loja_fechamento to authenticated;

notify pgrst, 'reload schema';
