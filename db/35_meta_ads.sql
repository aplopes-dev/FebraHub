-- ============================================================
-- FebraHub · Migration 35 — Estrutura para Meta Ads
--
-- Recebe o gasto diário por campanha/anúncio da Marketing API.
-- Conta act_426283099062813 (compartilhada Salvador/Recife — o
-- filtro de praça é por nome de campanha, padrão [PRODUTO]...).
--
-- O vínculo com os leads do Clint é o id_anuncio, que existe nos
-- dois lados: aqui e em fato_negocio_lead.id_anuncio.
-- ============================================================

create table if not exists public.fato_meta_insights (
  data              date not null,
  conta_id          text not null,
  campanha_id       text not null,
  campanha_nome     text,
  adset_id          text,
  adset_nome        text,
  anuncio_id        text,
  anuncio_nome      text,
  impressoes        bigint,
  alcance           bigint,
  cliques           bigint,
  gasto             numeric,
  leads             integer,
  cpl               numeric,
  atualizado_em     timestamptz default now(),
  anuncio_key       text generated always as (coalesce(anuncio_id,'')) stored,
  primary key (data, campanha_id, anuncio_key)
);

grant select on public.fato_meta_insights to authenticated;

-- View de gasto por campanha e mês, já com a praça inferida do nome
drop view if exists public.vw_marketing_investimento cascade;
create view public.vw_marketing_investimento as
select
  date_trunc('month', data)::date as mes,
  campanha_nome,
  case
    when campanha_nome ilike '%recife%'        then 'Recife'
    when campanha_nome ilike '%joão pessoa%'
      or campanha_nome ilike '%joao pessoa%'   then 'João Pessoa'
    when campanha_nome ilike '%serra talhada%' then 'Serra Talhada'
    when campanha_nome ilike '%ssa%'
      or campanha_nome ilike '%salvador%'      then 'Salvador'
    when campanha_nome ilike '%feira%'         then 'Feira de Santana'
    else 'Sem praça no nome'
  end as praca,
  nullif(trim(both '[]' from split_part(campanha_nome, ']', 1)),'') as produto,
  sum(impressoes) as impressoes,
  sum(cliques)    as cliques,
  sum(gasto)      as gasto,
  sum(leads)      as leads,
  case when sum(leads) > 0 then round(sum(gasto)/sum(leads),2) end as cpl
from public.fato_meta_insights
group by 1,2,3,4;

grant select on public.vw_marketing_investimento to authenticated;
