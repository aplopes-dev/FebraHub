-- ============================================================
-- FebraHub · Migration 40 — Atribuição lead → venda (piso comprovável)
--
-- Liga a venda ao lead do Clint por e-mail (99% preenchido) e por
-- telefone (via dim_leads). REGRA CRÍTICA: o lead precisa ter sido
-- criado ANTES do fechamento da venda — senão é falso positivo
-- (aluno antigo que virou lead depois não originou a compra passada).
--
-- Sem a trava temporal davam 112 vendas em 2026; COM ela, 74.
-- A diferença eram atribuições temporalmente impossíveis.
--
-- Cobertura real: ~7% das vendas de 2026 (74 de 1.066), R$238 mil.
-- 2025: 35 vendas. Anos anteriores não têm lead que preceda a venda.
--
-- Desempate: last touch — última campanha ANTES da venda. 1 linha/venda.
--
-- Rótulo no hub: "faturamento com origem confirmada em anúncio".
-- É um PISO comprovável — a influência real do digital é maior
-- (inclui quem viu anúncio e comprou sem preencher formulário),
-- mas o que se PROVA é isto.
-- ============================================================

drop view if exists public.vw_marketing_atribuicao cascade;
create view public.vw_marketing_atribuicao as
with matches as (
  -- match por e-mail, lead antes da venda
  select
    m.original_id_venda, m.data_fechamento_venda,
    l.nome_campanha, l.id_anuncio, l.data_criacao as data_lead
  from public.fato_base_alunos m
  join public.fato_negocio_lead l
    on l.email_contato is not null and trim(l.email_contato) <> ''
   and lower(trim(l.email_contato)) = m.email_cliente
  where m.email_cliente <> ''
    and m.data_fechamento_venda is not null
    and l.data_criacao <= m.data_fechamento_venda

  union

  -- match por telefone (telefone do lead vem da dim_leads), lead antes da venda
  select
    m.original_id_venda, m.data_fechamento_venda,
    l.nome_campanha, l.id_anuncio, l.data_criacao as data_lead
  from public.fato_base_alunos m
  join public.dim_leads d
    on length(regexp_replace(d.telefone_completo,'\D','','g')) between 10 and 13
   and regexp_replace(d.telefone_completo,'\D','','g') = m.telefone_cliente
  join public.fato_negocio_lead l on l.lead_id = d.lead_id
  where length(m.telefone_cliente) >= 10
    and m.data_fechamento_venda is not null
    and l.data_criacao <= m.data_fechamento_venda
),
ranked as (
  select
    original_id_venda, nome_campanha, id_anuncio, data_lead, data_fechamento_venda,
    row_number() over (
      partition by original_id_venda order by data_lead desc   -- last touch antes da venda
    ) as rn
  from matches
)
select
  r.original_id_venda,
  r.nome_campanha,
  r.id_anuncio,
  r.data_lead,
  r.data_fechamento_venda,
  f.data_pagamento,
  f.categoria_curso,
  f.curso,
  f.valor_bruto,
  case
    when r.nome_campanha ilike '%networking%' or r.nome_campanha ilike '%[ll]%' then 'LL'
    when r.nome_campanha ilike '%cis%' then 'CIS'
    when r.nome_campanha ilike '%bhp%' or r.nome_campanha ilike '%ml5%'
      or r.nome_campanha ilike '%fop%' or r.nome_campanha ilike '%fgpc%'
      or r.nome_campanha ilike '%[if]%' or r.nome_campanha ilike '%vend%' then 'GGB'
    when r.nome_campanha ilike '%[$]%' or r.nome_campanha ilike '%[lp]%'
      or r.nome_campanha ilike '%palestra%' or r.nome_campanha ilike '%evento%' then 'Eventos'
    when r.nome_campanha is null then 'Sem campanha'
    else 'Outros'
  end as categoria
from ranked r
join public.vw_venda_faturamento f on f.original_id_venda = r.original_id_venda
where r.rn = 1;

grant select on public.vw_marketing_atribuicao to authenticated;

-- Resumo por campanha e mês (faturamento atribuído = piso)
drop view if exists public.vw_marketing_atribuicao_campanha cascade;
create view public.vw_marketing_atribuicao_campanha as
select
  date_trunc('month', coalesce(data_fechamento_venda, data_pagamento))::date as mes,
  nome_campanha,
  categoria,
  count(*)                as vendas_atribuidas,
  round(sum(valor_bruto)) as faturamento_atribuido
from public.vw_marketing_atribuicao
group by 1,2,3;

grant select on public.vw_marketing_atribuicao_campanha to authenticated;

notify pgrst, 'reload schema';
