-- ============================================================
-- FebraHub · Migration 31 — Separa PIX de Cartão no gráfico de formas
--
-- Antes, "Cartão/PIX CisPay" juntava R$4,8M de Pix com R$40M de cartão.
-- O custo dos dois é muito diferente (Pix ~zero, cartão tem taxa), então
-- agrupar escondia a informação mais útil para a gestão financeira.
--
-- Praças (Barueri, Fortaleza) seguem consolidadas em "Cartão CisPay".
-- ============================================================

drop view if exists public.vw_financeiro_formas_pagamento cascade;
create view public.vw_financeiro_formas_pagamento as
with formas_da_venda as (
  select original_id_venda,
         count(distinct forma_pagamento) as n_formas,
         min(forma_pagamento)            as forma_unica
  from public.fato_pagamento_base
  group by original_id_venda
)
select
  case
    when fv.n_formas > 1 then 'Múltiplas formas'
    when fv.forma_unica ilike '%pix%'       then 'PIX'
    when fv.forma_unica ilike '%cispay%'
      or fv.forma_unica ilike '%cielo%'     then 'Cartão CisPay'
    when fv.forma_unica ilike '%boleto%'    then 'Boleto'
    when fv.forma_unica ilike '%transfer%'  then 'Transferência'
    when fv.forma_unica ilike '%dinheiro%'  then 'Dinheiro'
    when fv.forma_unica ilike '%cheque%'    then 'Cheque'
    when fv.forma_unica ilike '%credito de curso%'
      or fv.forma_unica ilike '%credito em curso%'
      or fv.forma_unica ilike '%pontos%'    then 'Crédito/Bônus interno'
    when fv.forma_unica ilike '%getnet%' or fv.forma_unica ilike '%rede%'
      or fv.forma_unica ilike '%stone%'  or fv.forma_unica ilike '%pagseguro%'
                                            then 'Adquirente legada'
    else 'Outras'
  end                       as forma,
  count(*)                  as vendas,
  round(sum(f.valor))       as receita
from public.vw_venda_faturamento f
join formas_da_venda fv on fv.original_id_venda = f.original_id_venda
where public.pode_ver('financeiro')
group by 1
order by 3 desc;

grant select on public.vw_financeiro_formas_pagamento to authenticated;

notify pgrst, 'reload schema';
