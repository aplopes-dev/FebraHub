-- ============================================================
-- FebraHub · Migration 28 — Detalhamento das vendas com carinha verde
--
-- Pedido da gestora do financeiro: ver venda a venda quais foram as
-- verdes, com link direto para o Salesforce e as formas de pagamento
-- que compuseram cada uma (a classificação fica auditável).
--
-- Escopo: as 3 consultoras GGB, desde a largada da gamificação (jan/2025).
-- Verde = todas as formas da venda são "boas" (Pix, transferência,
-- dinheiro, cheque), ignorando as neutras (boleto, crédito de curso).
-- ============================================================

drop view if exists public.vw_comercial_verdes_detalhe cascade;
create view public.vw_comercial_verdes_detalhe as
select
  c.data_pagamento                          as data,
  c.consultora,
  cons.foto_url,
  -- o nome_venda vem como "ANO - CÓDIGO - CLIENTE"
  nullif(split_part(p.nome_venda, ' - ', 3), '')  as cliente,
  split_part(p.nome_venda, ' - ', 2)              as codigo_turma,
  coalesce(f.curso_curto, f.curso)                as curso,
  f.categoria_curso                               as categoria,
  round(c.valor)                                  as valor,
  -- todas as formas que compuseram a venda
  p.formas,
  p.n_formas,
  c.original_id_venda,
  'https://febracis.lightning.force.com/lightning/r/Opportunity/'
    || c.original_id_venda || '/view'              as link_salesforce
from public.vw_comercial_carinhas c
join public.dim_consultores cons on cons.consultor_id = c.consultor_id
left join public.vw_venda_faturamento f on f.original_id_venda = c.original_id_venda
left join lateral (
  select string_agg(distinct forma_pagamento, ' + ' order by forma_pagamento) as formas,
         count(distinct forma_pagamento)                                      as n_formas,
         max(nome_venda)                                                      as nome_venda
  from public.fato_pagamento_base
  where original_id_venda = c.original_id_venda
) p on true
where c.carinha = 'verde'
  and c.data_pagamento >= '2025-01-01'
  and c.consultor_id in (
    'Alana Faleiro Coutinho',
    'Beatriz Souza',
    'Beatriz Martins de Novaes'
  );

grant select on public.vw_comercial_verdes_detalhe to authenticated;

-- NOTA front: filtrar por período (data) e por consultora.
-- `link_salesforce` abre a oportunidade direto no Salesforce.
-- `formas` mostra o que compôs a venda — é o que torna a
-- classificação auditável pela gestora.
