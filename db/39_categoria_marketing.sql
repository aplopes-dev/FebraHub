-- ============================================================
-- FebraHub · Migration 39 — Categoria de marketing nas campanhas
--
-- Classifica cada campanha do Meta em CIS, GGB, LL ou Outros,
-- pelo produto no nome. Regra definida com o negócio:
--   CIS  = qualquer campanha com "CIS" no nome
--   LL   = campanhas de LL Networking
--   GGB  = IF, BHP, ML5, FOP, FGPC, TV (produtos de formação)
--   Sympla = fica para a 2a fase (ligação anúncio x check-in)
--   Outros = fora de padrão (nome sem produto reconhecível)
--
-- A categoria entra na vw_marketing_desempenho para o hub filtrar.
-- ============================================================

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
  case
    when g.campanha_nome ilike '%[leads]%'  then 'Captação'
    when g.campanha_nome ilike '%[live]%'   then 'Live'
    when g.campanha_nome ilike '%[lp]%'
      or g.campanha_nome ilike '%[$]%'      then 'Venda/Evento'
    else 'Outros'
  end as tipo,
  -- categoria de negócio
  case
    when g.campanha_nome ilike '%networking%'
      or g.campanha_nome ilike '%[ll]%'          then 'LL'
    when g.campanha_nome ilike '%cis%'           then 'CIS'
    when g.campanha_nome ilike '%bhp%'
      or g.campanha_nome ilike '%ml5%'
      or g.campanha_nome ilike '% if %' or g.campanha_nome ilike '%-if %'
      or g.campanha_nome ilike '%[if]%' or g.campanha_nome ilike '% if-%'
      or g.campanha_nome ilike '%fop%'
      or g.campanha_nome ilike '%fgpc%'
      or g.campanha_nome ilike '%maestria%'
      or g.campanha_nome ilike '%t.vendas%' or g.campanha_nome ilike '%tv %'
      or g.campanha_nome ilike '%técnica%vend%' or g.campanha_nome ilike '%tecnica%vend%'
      or g.campanha_nome ilike '%vend%mais%'    then 'GGB'
    -- eventos e palestras de venda direta (marcados por [$] ou nomes de palestra)
    when g.campanha_nome ilike '%[$]%'
      or g.campanha_nome ilike '%[lp]%'
      or g.campanha_nome ilike '%[live]%'
      or g.campanha_nome ilike '%palestra%'
      or g.campanha_nome ilike '%encontro%casai%'
      or g.campanha_nome ilike '%webinar%'
      or g.campanha_nome ilike '%masterclass%'
      or g.campanha_nome ilike '%tour%'
      or g.campanha_nome ilike '%sympla%'
      or g.campanha_nome ilike '%galdino%'
      or g.campanha_nome ilike '%ia para negocio%' or g.campanha_nome ilike '%pmc%'  then 'Eventos'
    else 'Outros'
  end as categoria,
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
group by 1,2,3,4,5;

grant select on public.vw_marketing_desempenho to authenticated;

-- resumo mensal herda igual (já lê de desempenho)
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
