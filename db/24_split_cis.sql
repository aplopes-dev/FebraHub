-- ============================================================
-- FebraHub · Migration 24 — Splits: CIS Global, Coaching Individual, Mentorias
--
-- REGRA (definida com o negócio):
--   CIS GLOBAL — participação da unidade:
--     até 31/12/2022 ............ 20%  (80% holding)
--     01/01/2023 a 31/05/2026 ... 50%  (50% holding)
--     a partir de 01/06/2026 .... 80%  (20% holding)
--
--   CIS PRESENCIAL — 100% (PENDENTE: a unidade vende para a holding e
--   existe política de comissão ainda não definida. Fica com valor cheio
--   até a gestora do financeiro informar o percentual. Superestima, mas
--   não inventa número.)
--
--   METODO CIS GLOBAL HOLDING e REVOLUTION (CIS Revolution) —
--   receita zero: a venda fica com a consultora (bruto no Comercial),
--   mas o valor é integralmente repassado (nada no Financeiro).
--   >>> CONFIRMAR: se ficar alguma parte, ajustar o CASE abaixo.
--
--   Coaching Individual — 50% (inalterado).
--   Mentoria:
--     TEAM COACHING BUSINESS e TEAM COACHING LIFE — 50% (desde sempre).
--     Demais mentorias (inclui MENTORIA BUSINESS) — 100%, sem repasse.
-- ============================================================

drop view if exists public.vw_venda_faturamento cascade;
create view public.vw_venda_faturamento as
with venda_valor as (
  select
    p.original_id_venda,
    max(p.consultor_id)   as consultor_id,
    max(p.data_pagamento) as data_pagamento,
    max(p.valor)          as valor,
    max(p.tipo_matricula) as tipo_matricula
  from public.fato_pagamento_base p
  where p.tipo_matricula in ('Matrícula','COMPRADOR DE VAGAS','MAT. RETROATIVA')
    and p.valor is not null
    and p.data_pagamento is not null
  group by p.original_id_venda
),
matricula_da_venda as (
  select distinct on (original_id_venda) original_id_venda, curso_id
  from public.fato_base_alunos
  where curso_id is not null
  order by original_id_venda, valor desc nulls last
)
select
  vv.original_id_venda,
  vv.consultor_id,
  vv.data_pagamento,
  vv.tipo_matricula,
  coalesce(cur.tipo, 'Sem categoria')      as categoria_curso,
  coalesce(cur.nome_curso, 'Sem vínculo')  as curso,
  -- percentual que fica com a unidade (documenta a regra na própria view)
  case
    when cur.curso_id in ('METODO CIS GLOBAL HOLDING','REVOLUTION') then 0.0
    when cur.curso_id in ('METODO CIS GLOBAL',
                          'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                          'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                          'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL') then
         case
           when vv.data_pagamento <  '2023-01-01' then 0.20
           when vv.data_pagamento <  '2026-06-01' then 0.50
           else                                        0.80
         end
    when cur.curso_id in ('TEAM COACHING BUSINESS',
                          'TEAM COACHING LIFE')                then 0.50
    when cur.tipo = 'Coaching Individual'                      then 0.50
    else 1.0
  end                                      as pct_unidade,
  vv.valor                                 as valor_bruto,
  vv.valor *
  case
    when cur.curso_id in ('METODO CIS GLOBAL HOLDING','REVOLUTION') then 0.0
    when cur.curso_id in ('METODO CIS GLOBAL',
                          'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                          'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                          'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL') then
         case
           when vv.data_pagamento <  '2023-01-01' then 0.20
           when vv.data_pagamento <  '2026-06-01' then 0.50
           else                                        0.80
         end
    when cur.curso_id in ('TEAM COACHING BUSINESS',
                          'TEAM COACHING LIFE')                then 0.50
    when cur.tipo = 'Coaching Individual'                      then 0.50
    else 1.0
  end                                      as valor
from venda_valor vv
left join matricula_da_venda m on m.original_id_venda = vv.original_id_venda
left join public.dim_cursos cur on cur.curso_id = m.curso_id;

grant select on public.vw_venda_faturamento to authenticated;
