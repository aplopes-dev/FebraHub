-- ============================================================
-- FebraHub · Migration 41 — Setor 'marketing' nas views
--
-- Cria acesso do perfil de marketing (Bruno Cordeiro) aos hubs de
-- marketing. As views usavam pode_ver('geral'); agora aceitam
-- 'geral' OU 'marketing', para o gestor ver só o que é dele.
--
-- Roda DEPOIS de trocar o setor do Bruno para 'marketing'.
-- ============================================================

-- Recria cada view de marketing trocando o filtro RLS.
-- (só a cláusula where muda; o corpo é o mesmo já em produção)

-- vw_marketing_leads
drop view if exists public.vw_marketing_leads cascade;
create view public.vw_marketing_leads as
select
  l.negocio_id, l.lead_id, l.data_criacao,
  date_trunc('month', l.data_criacao)::date as mes,
  l.consultor_id, cu.nome as consultora,
  l.nome_campanha, l.id_anuncio, l.nome_anuncio, l.nome_formulario,
  l.aplicativo_origem,
  initcap(trim(regexp_replace(l.etapa_funil, '\s+', ' ', 'g'))) as etapa,
  l.status_negocio,
  nullif(trim(both '[]' from split_part(l.nome_campanha, ']', 1)), '') as produto_campanha
from public.fato_negocio_lead l
join public.consultor_unidade cu on cu.consultor_id = l.consultor_id
where cu.unidade = 'Salvador'
  and (public.pode_ver('geral') or public.pode_ver('marketing'));
grant select on public.vw_marketing_leads to authenticated;

-- as views que dependem de vw_marketing_leads são recriadas pelo cascade;
-- recriar aqui:

-- vw_marketing_leads_campanha
drop view if exists public.vw_marketing_leads_campanha cascade;
create view public.vw_marketing_leads_campanha as
select mes, nome_campanha, produto_campanha, id_anuncio, aplicativo_origem,
       count(*) as leads, count(distinct consultora) as consultoras
from public.vw_marketing_leads
where nome_campanha is not null and nome_campanha <> ''
group by 1,2,3,4,5;
grant select on public.vw_marketing_leads_campanha to authenticated;

-- vw_marketing_funil
drop view if exists public.vw_marketing_funil cascade;
create view public.vw_marketing_funil as
select mes, etapa, consultora, count(*) as leads
from public.vw_marketing_leads
group by 1,2,3;
grant select on public.vw_marketing_funil to authenticated;

-- vw_marketing_origem_vendas (tinha pode_ver('geral'))
drop view if exists public.vw_marketing_origem_vendas cascade;
create view public.vw_marketing_origem_vendas as
with origem_por_venda as (
  select original_id_venda, max(origem_lead) as origem
  from public.fato_base_alunos group by original_id_venda
)
select
  date_trunc('month', f.data_pagamento)::date as mes,
  case
    when o.origem ilike '%[form]%' or o.origem ilike '%tráfego%'
      or o.origem ilike '%trafego%' or o.origem ilike '%google%'
      or o.origem ilike '%[go]%'                     then 'Tráfego Pago'
    when o.origem ilike '%indica%'                   then 'Indicação'
    when o.origem ilike '%instagram%'                then 'Instagram'
    when o.origem ilike '%whatsapp%'                 then 'WhatsApp'
    when o.origem ilike '%pedido%'                   then 'Pedido (genérico)'
    when o.origem is null or o.origem = ''           then 'Sem origem'
    else 'Outros'
  end as canal,
  count(*) as vendas, round(sum(f.valor_bruto)) as valor
from public.vw_venda_faturamento f
left join origem_por_venda o on o.original_id_venda = f.original_id_venda
where (public.pode_ver('geral') or public.pode_ver('marketing'))
group by 1,2;
grant select on public.vw_marketing_origem_vendas to authenticated;

notify pgrst, 'reload schema';
