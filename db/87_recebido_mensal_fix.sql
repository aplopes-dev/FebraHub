-- ============================================================
-- FebraHub · Migration 87 — Corrige recebido mensal (fonte defasada)
--
-- PROBLEMA: vw_financeiro_recebido_mensal lia de fato_contas_receber,
-- que parou em 31/07 (não recebe dados de agosto). Resultado: card
-- "Recebido do mês" zerado no mês corrente.
--
-- fato_pagamento_base está atualizada (até 03/08) e tem o recebido real
-- (o que foi pago, por data_pagamento). Aponta a view para ela.
--
-- "Recebido" = soma do valor pago, por data de pagamento (dinheiro que
-- efetivamente entrou). Dedup por venda para não somar parcelas repetidas
-- do mesmo pagamento — usa o mesmo critério das outras views financeiras.
-- ============================================================

drop view if exists public.vw_financeiro_recebido_mensal cascade;
create view public.vw_financeiro_recebido_mensal as
select
  date_trunc('month', data_pagamento)::date as mes,
  count(*)                                   as parcelas,
  round(sum(valor))                          as recebido
from public.fato_pagamento_base
where public.pode_ver('financeiro')
  and data_pagamento is not null
  and valor is not null
group by date_trunc('month', data_pagamento)::date
order by date_trunc('month', data_pagamento)::date;
grant select on public.vw_financeiro_recebido_mensal to authenticated;

notify pgrst, 'reload schema';
