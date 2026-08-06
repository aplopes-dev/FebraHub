-- ============================================================
-- FebraHub · Migration 48 — Formas de pagamento da Loja (Omie)
--
-- Fonte: endpoint CuponsPagamentos (mesmo serviço do cupom fiscal).
-- Traz forma de pagamento, bandeira, parcelas e valor de cada
-- pagamento do cupom. Um cupom pode ter mais de um pagamento.
--
-- Códigos cIndPag do Omie (forma de pagamento):
--   01 Dinheiro · 02 Cheque · 03 Cartão de Crédito · 04 Cartão de Débito
--   05 Crédito Loja · 10 Vale Alimentação · 11 Vale Refeição
--   12 Vale Presente · 13 Vale Combustível · 15 Boleto
--   16 Depósito · 17 PIX · 18 Transferência · 19 Cashback
--   90 Sem pagamento · 99 Outros
-- ============================================================

create table if not exists public.fato_loja_pagamento (
  cupom_id        bigint not null,
  seq_item        integer not null,
  forma_codigo    text,           -- cIndPag
  forma           text,           -- descrição traduzida
  meio_codigo     text,           -- cMeioPag
  bandeira        text,           -- cBandeira
  parcelas        integer,
  valor           numeric,
  data_transacao  date,
  nsu             text,
  atualizado_em   timestamptz default now(),
  primary key (cupom_id, seq_item)
);
grant select on public.fato_loja_pagamento to authenticated;

-- Formas de pagamento agregadas por mês
drop view if exists public.vw_loja_formas_pagamento cascade;
create view public.vw_loja_formas_pagamento as
select
  date_trunc('month', c.data_emissao)::date as mes,
  coalesce(nullif(p.forma,''), 'Não informado') as forma,
  count(*)              as transacoes,
  round(sum(p.valor))   as valor
from public.fato_loja_pagamento p
join public.fato_loja_cupom c on c.cupom_id = p.cupom_id
where not c.cancelado
  and public.pode_ver('loja')
group by 1,2;
grant select on public.vw_loja_formas_pagamento to authenticated;

notify pgrst, 'reload schema';
