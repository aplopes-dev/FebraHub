-- ============================================================
-- FebraHub · Migration 34 — Leads da unidade Salvador
--
-- O Clint atendia Salvador e Recife na mesma conta. O filtro é por
-- consultor, não por nome de campanha — 5.797 leads não trazem praça
-- no nome, então o critério por campanha seria impreciso.
--
-- ATENÇÃO: o CRM está sendo trocado (julho/2026). Esta view tem prazo
-- curto; a parte estável do Hub Marketing é o investimento do Meta,
-- que independe de CRM.
--
-- Limitação conhecida: todos os status_negocio estão como OPEN — o
-- Clint não registra desfecho. Dá para medir leads e etapa, não
-- conversão em venda.
-- ============================================================

-- Consultoras da unidade Salvador (ids do Clint)
create table if not exists public.consultor_unidade (
  consultor_id text primary key,
  nome         text,
  unidade      text not null
);

delete from public.consultor_unidade;
insert into public.consultor_unidade (consultor_id, nome, unidade) values
  ('fb96cdf3-9dc5-473a-8309-1de2fe52c5e1','MARLANY BONA',              'Salvador'),
  ('405388cb-096b-4fb0-9514-46fae5c1cc4d','Cássia Romão',              'Salvador'),
  ('3f0da964-27b9-49af-9f62-bc927dae6ff4','Alana Faleiro',             'Salvador'),
  ('77dd1a6c-d036-495c-9153-0e81e751bba8','Jennifer Mota',             'Salvador'),
  ('1e40d21e-eb01-4172-8b45-5bb70355ffe5','Bianca Nascimento',         'Salvador'),
  ('3a9df7de-0854-42dc-948b-e0af1bd31b92','Beatriz Souza',             'Salvador'),
  ('7db3a65d-b0f5-4cb1-af58-4fd613166d61','Beatriz Martins de Novaes', 'Salvador');

grant select on public.consultor_unidade to authenticated;

-- ------------------------------------------------------------
-- Leads de Salvador, com campanha normalizada
-- ------------------------------------------------------------
drop view if exists public.vw_marketing_leads cascade;
create view public.vw_marketing_leads as
select
  l.negocio_id,
  l.lead_id,
  l.data_criacao,
  date_trunc('month', l.data_criacao)::date  as mes,
  l.consultor_id,
  cu.nome                                    as consultora,
  l.nome_campanha,
  l.id_anuncio,
  l.nome_anuncio,
  l.nome_formulario,
  l.aplicativo_origem,
  -- etapa normalizada (o Clint tem a mesma etapa em várias grafias)
  initcap(trim(regexp_replace(l.etapa_funil, '\s+', ' ', 'g'))) as etapa,
  l.status_negocio,
  -- produto extraído do padrão [PRODUTO][TIPO][MÊS] PRAÇA
  nullif(trim(both '[]' from split_part(l.nome_campanha, ']', 1)), '') as produto_campanha
from public.fato_negocio_lead l
join public.consultor_unidade cu on cu.consultor_id = l.consultor_id
where cu.unidade = 'Salvador'
  and public.pode_ver('marketing');

grant select on public.vw_marketing_leads to authenticated;

-- ------------------------------------------------------------
-- Leads por campanha e mês — base do custo por lead
-- ------------------------------------------------------------
drop view if exists public.vw_marketing_leads_campanha cascade;
create view public.vw_marketing_leads_campanha as
select
  mes,
  nome_campanha,
  produto_campanha,
  id_anuncio,
  aplicativo_origem,
  count(*)                    as leads,
  count(distinct consultora)  as consultoras
from public.vw_marketing_leads
where nome_campanha is not null and nome_campanha <> ''
group by 1,2,3,4,5;

grant select on public.vw_marketing_leads_campanha to authenticated;

-- ------------------------------------------------------------
-- Distribuição por etapa do funil
-- ------------------------------------------------------------
drop view if exists public.vw_marketing_funil cascade;
create view public.vw_marketing_funil as
select
  mes,
  etapa,
  consultora,
  count(*) as leads
from public.vw_marketing_leads
group by 1,2,3;

grant select on public.vw_marketing_funil to authenticated;

notify pgrst, 'reload schema';
