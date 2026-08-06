-- ============================================================
-- FebraHub · Migration 38 — Origem das vendas (otimizada)
--
-- A versão da 37 usava LEFT JOIN LATERAL com subquery correlacionada
-- por venda, o que estourou o statement timeout. Reescrita com um
-- join agregado simples: 1 origem por venda, calculada antes.
-- ============================================================

drop view if exists public.vw_marketing_origem_vendas cascade;
create view public.vw_marketing_origem_vendas as
with origem_por_venda as (
  select original_id_venda, max(origem_lead) as origem
  from public.fato_base_alunos
  group by original_id_venda
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
  end                                      as canal,
  count(*)                                 as vendas,
  round(sum(f.valor_bruto))                as valor
from public.vw_venda_faturamento f
left join origem_por_venda o on o.original_id_venda = f.original_id_venda
where public.pode_ver('geral')
group by 1,2;

grant select on public.vw_marketing_origem_vendas to authenticated;

notify pgrst, 'reload schema';
