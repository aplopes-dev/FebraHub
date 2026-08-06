-- ============================================================
-- FebraHub · Migration 85 — Reconciliação CisPay/Stone × Salesforce
--
-- Cruza fato_liquidacao_cartao (o que a CisPay/Stone liquidou/repassou)
-- com fato_pagamento_base (o que o Salesforce registrou como vendido).
--
-- CHAVE: o link_salesforce da liquidação embute o ID do Forma_Pag_Venda__c
-- (a0L...), que é o pagamento_id no Salesforce. Extrai do link e casa.
--
-- Responde: quanto foi vendido por cartão x quanto foi repassado; a taxa
-- retida; e divergências (venda sem repasse, repasse sem venda).
-- ============================================================

-- View base: cada liquidação ligada ao seu pagamento
drop view if exists public.vw_financeiro_reconciliacao_cartao cascade;
create view public.vw_financeiro_reconciliacao_cartao as
select
  l.parcela_id,
  substring(l.link_salesforce from 'Forma_Pag_Venda__c/([^/]+)/view') as pagamento_id_link,
  p.original_id_venda,
  l.data_venda,
  l.data_liquidacao,
  l.bandeira,
  l.tipo_transacao,
  l.numero_parcela,
  l.total_parcelas,
  l.valor_bruto                                    as valor_liquidacao_bruto,
  l.valor_liquido                                  as valor_repassado,
  l.taxa_cispay,
  l.pct_mdr,
  (l.valor_bruto - l.valor_liquido)                as taxa_total,
  round(100.0 * (l.valor_bruto - l.valor_liquido)
        / nullif(l.valor_bruto, 0), 2)             as pct_taxa_efetiva
from public.fato_liquidacao_cartao l
join public.fato_pagamento_base p
  on p.pagamento_id = substring(l.link_salesforce from 'Forma_Pag_Venda__c/([^/]+)/view')
where public.pode_ver('financeiro');
grant select on public.vw_financeiro_reconciliacao_cartao to authenticated;

-- Resumo mensal: vendido vs repassado vs taxa
drop view if exists public.vw_financeiro_reconciliacao_mensal cascade;
create view public.vw_financeiro_reconciliacao_mensal as
select
  date_trunc('month', l.data_liquidacao)::date    as mes,
  count(*) filter (where l.valor_bruto > 0 and l.valor_liquido > 0) as transacoes,
  round(sum(l.valor_bruto) filter (where l.valor_bruto > 0 and l.valor_liquido > 0))   as bruto_liquidado,
  round(sum(l.valor_liquido) filter (where l.valor_bruto > 0 and l.valor_liquido > 0)) as repassado,
  round(sum(l.valor_bruto - l.valor_liquido) filter (where l.valor_bruto > 0 and l.valor_liquido > 0)) as taxa_total,
  round(100.0 * sum(l.valor_bruto - l.valor_liquido) filter (where l.valor_bruto > 0 and l.valor_liquido > 0)
        / nullif(sum(l.valor_bruto) filter (where l.valor_bruto > 0 and l.valor_liquido > 0), 0), 2) as pct_taxa_media
from public.fato_liquidacao_cartao l
where public.pode_ver('financeiro')
group by date_trunc('month', l.data_liquidacao)::date
order by mes;
grant select on public.vw_financeiro_reconciliacao_mensal to authenticated;

-- KPIs gerais
drop view if exists public.vw_financeiro_reconciliacao_kpis cascade;
create view public.vw_financeiro_reconciliacao_kpis as
select
  count(*) filter (where valor_bruto > 0 and valor_liquido > 0) as transacoes,
  round(sum(valor_bruto) filter (where valor_bruto > 0 and valor_liquido > 0))    as total_bruto,
  round(sum(valor_liquido) filter (where valor_bruto > 0 and valor_liquido > 0))  as total_repassado,
  round(sum(valor_bruto - valor_liquido) filter (where valor_bruto > 0 and valor_liquido > 0)) as total_taxa,
  round(100.0 * sum(valor_bruto - valor_liquido) filter (where valor_bruto > 0 and valor_liquido > 0)
        / nullif(sum(valor_bruto) filter (where valor_bruto > 0 and valor_liquido > 0), 0), 2) as pct_taxa_media
from public.fato_liquidacao_cartao
where public.pode_ver('financeiro');
grant select on public.vw_financeiro_reconciliacao_kpis to authenticated;

notify pgrst, 'reload schema';
