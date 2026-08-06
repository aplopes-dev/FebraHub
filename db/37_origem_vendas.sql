-- ============================================================
-- FebraHub · Migration 37 — Origem das vendas (canal)
--
-- Agrupa as vendas por canal de origem, a partir do campo origem_lead
-- da base de alunos. O preenchimento melhorou muito a partir de
-- junho/2026 (de ~5% para ~64% em julho), então a view é confiável
-- desse ponto em diante — antes, a maioria cai em "Sem origem".
--
-- NÃO confundir com vw_marketing_origem, que é sobre origem dos LEADS
-- (Clint). Esta é sobre origem das VENDAS fechadas (Salesforce).
--
-- Limitação: o canal genérico "Pedido" é o valor padrão quando o
-- vendedor não marca origem — continua sendo a maior fatia.
-- ============================================================

drop view if exists public.vw_marketing_origem_vendas cascade;
create view public.vw_marketing_origem_vendas as
select
  date_trunc('month', f.data_pagamento)::date as mes,
  case
    when o.origem ilike '%[form]%' or o.origem ilike '%tráfego%'
      or o.origem ilike '%trafego%' or o.origem ilike '%google%'
      or o.origem ilike '%[go]%'                         then 'Tráfego Pago'
    when o.origem ilike '%indica%'                       then 'Indicação'
    when o.origem ilike '%instagram%'                    then 'Instagram'
    when o.origem ilike '%whatsapp%'                     then 'WhatsApp'
    when o.origem ilike '%pedido%'                       then 'Pedido (genérico)'
    when o.origem is null or o.origem = ''               then 'Sem origem'
    else 'Outros'
  end                                          as canal,
  -- marca se a origem identifica a campanha exata (permite ligar ao Meta)
  bool_or(o.origem ilike '%[form]%')           as tem_campanha,
  count(*)                                     as vendas,
  round(sum(f.valor_bruto))                    as valor
from public.vw_venda_faturamento f
left join lateral (
  select max(m.origem_lead) as origem
  from public.fato_base_alunos m
  where m.original_id_venda = f.original_id_venda
) o on true
where public.pode_ver('geral')
group by 1,2;

grant select on public.vw_marketing_origem_vendas to authenticated;

notify pgrst, 'reload schema';
