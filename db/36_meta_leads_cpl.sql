-- ============================================================
-- FebraHub · Migration 36 — Meta Ads cruzado com leads (CPL real)
--
-- Liga o gasto do Meta (fato_meta_insights) aos leads do Clint
-- (fato_negocio_lead) pelo id_anuncio, que existe nos dois lados.
--
-- CPL = custo por lead, por campanha e mês. Só faz sentido para
-- campanhas de captação; campanhas de venda/live não geram lead
-- no Clint e aparecem com leads = 0.
--
-- Conta só de Salvador, então todo o gasto é da unidade.
-- ============================================================

-- Leads por anúncio e mês (só Salvador, via consultor_unidade)
drop view if exists public.vw_marketing_leads_por_anuncio cascade;
create view public.vw_marketing_leads_por_anuncio as
select
  date_trunc('month', l.data_criacao)::date as mes,
  l.id_anuncio,
  count(*) as leads
from public.fato_negocio_lead l
join public.consultor_unidade cu on cu.consultor_id = l.consultor_id
where cu.unidade = 'Salvador'
  and l.id_anuncio is not null and l.id_anuncio <> ''
group by 1,2;

grant select on public.vw_marketing_leads_por_anuncio to authenticated;

-- Gasto + leads por campanha e mês, com CPL
drop view if exists public.vw_marketing_desempenho cascade;
create view public.vw_marketing_desempenho as
with gasto as (
  select
    date_trunc('month', data)::date as mes,
    campanha_id,
    max(campanha_nome)  as campanha_nome,
    anuncio_id,
    sum(gasto)          as gasto,
    sum(impressoes)     as impressoes,
    sum(alcance)        as alcance,
    sum(cliques)        as cliques
  from public.fato_meta_insights
  group by 1,2,4
),
leads as (
  select mes, id_anuncio, leads
  from public.vw_marketing_leads_por_anuncio
)
select
  g.mes,
  g.campanha_nome,
  -- tipo pela nomenclatura: [PRODUTO][LEADS] capta; [EG][$] e [LP] vendem
  case
    when g.campanha_nome ilike '%[leads]%'  then 'Captação'
    when g.campanha_nome ilike '%[live]%'   then 'Live'
    when g.campanha_nome ilike '%[lp]%'
      or g.campanha_nome ilike '%[$]%'      then 'Venda/Evento'
    else 'Outros'
  end as tipo,
  -- produto do primeiro colchete
  nullif(trim(both '[]' from split_part(g.campanha_nome,']',1)),'') as produto,
  sum(g.gasto)        as gasto,
  sum(g.impressoes)   as impressoes,
  sum(g.alcance)      as alcance,
  sum(g.cliques)      as cliques,
  sum(coalesce(l.leads,0)) as leads,
  case when sum(coalesce(l.leads,0)) > 0
       then round(sum(g.gasto)/sum(l.leads),2) end as cpl
from gasto g
left join leads l on l.id_anuncio = g.anuncio_id and l.mes = g.mes
group by 1,2,3,4;

grant select on public.vw_marketing_desempenho to authenticated;

-- Resumo mensal: investimento total, leads, CPL médio das campanhas de captação
drop view if exists public.vw_marketing_resumo_mensal cascade;
create view public.vw_marketing_resumo_mensal as
select
  mes,
  round(sum(gasto))                                          as investimento,
  sum(leads)                                                 as leads,
  round(sum(gasto) filter (where tipo='Captação'))           as gasto_captacao,
  sum(leads) filter (where tipo='Captação')                  as leads_captacao,
  case when sum(leads) filter (where tipo='Captação') > 0
       then round(sum(gasto) filter (where tipo='Captação')
                  / sum(leads) filter (where tipo='Captação'), 2) end as cpl_medio
from public.vw_marketing_desempenho
group by 1 order by 1;

grant select on public.vw_marketing_resumo_mensal to authenticated;

notify pgrst, 'reload schema';
