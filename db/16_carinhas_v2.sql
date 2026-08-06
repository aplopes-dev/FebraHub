-- ============================================================
-- FebraHub · Migration 16 — Gamificação v2 (carinhas por composição)
--
-- REGRA (definida com a gestora do financeiro):
--   A cor é da VENDA (não da parcela). Uma venda pode ter várias
--   formas de pagamento. Classifica pela COMPOSIÇÃO:
--
--   Tipos de forma:
--     BOM     = Pix, Transferência, Dinheiro, Cheque (custo ~zero)
--     CARTAO  = CisPay, Stone/Cielo, Getnet (tem taxa)
--     NEUTRO  = Boleto, Crédito de curso, Cashback, Pontos, Permuta
--               (ignorados: não entram na decisão da cor)
--
--   Cor, olhando só BOM + CARTAO (neutros removidos):
--     VERDE    = só BOM (100% Pix/transf/dinheiro/cheque)
--     VERMELHA = só CARTAO e 100% Stone (o pior, definido pela gestora)
--     AMARELA  = qualquer mistura (bom+cartão, ou cartão não-100%-Stone,
--                incluindo 100% cartão CisPay sem Pix — ver NOTA)
--
--   NOTA: "100% cartão CisPay sem Pix" caiu em AMARELA (cartão, mas não
--   é o pior). A gestora não definiu esse caso explicitamente; se quiser
--   tratá-lo diferente, mudar o CASE abaixo.
--
--   Venda sem nenhuma forma BOM nem CARTAO (só neutros) = sem carinha.
--
-- CONTAGEM: acumulada (não semanal). Reset em 10:
--   10 verdes -> zera verdes + ganha brinde surpresa (🎁?)
--   10 vermelhas -> zera vermelhas + perde a semanal
--   Amarelo é só visual, não conta pro reset.
-- ============================================================

-- ---------- Classifica cada forma de pagamento em BOM/CARTAO/NEUTRO ----------
create or replace view public.vw_comercial_forma_tipo as
select
  forma_pagamento,
  case
    when forma_pagamento ilike '%pix%'
      or forma_pagamento ilike '%transferencia%' or forma_pagamento ilike '%transferência%'
      or forma_pagamento ilike '%dinheiro%'
      or forma_pagamento ilike '%cheque%'                         then 'bom'
    when forma_pagamento ilike '%cispay%'
      or forma_pagamento ilike '%stone%' or forma_pagamento ilike '%cielo%'
      or forma_pagamento ilike '%getnet%'
      or forma_pagamento ilike '%rede%'                           then 'cartao'
    else 'neutro'   -- boleto, crédito de curso, cashback, pontos, permuta
  end as tipo,
  case
    when forma_pagamento ilike '%stone%' or forma_pagamento ilike '%cielo%'
      then true else false
  end as eh_stone
from (select distinct forma_pagamento from public.fato_pagamento_base) f;

-- ---------- Cor de cada VENDA, pela composição ----------
create or replace view public.vw_comercial_carinhas as
with venda_formas as (
  -- por venda: quais tipos apareceram, e se todo cartão foi Stone
  select
    p.original_id_venda,
    max(p.consultor_id)                                  as consultor_id,
    max(p.data_pagamento)                                as data_pagamento,
    sum(p.valor)                                         as valor,
    bool_or(t.tipo = 'bom')                              as tem_bom,
    bool_or(t.tipo = 'cartao')                           as tem_cartao,
    -- só entre os cartões: todos são Stone?
    bool_and(case when t.tipo = 'cartao' then t.eh_stone end) as cartao_so_stone
  from public.fato_pagamento_base p
  join public.vw_comercial_forma_tipo t on t.forma_pagamento = p.forma_pagamento
  where p.original_id_venda is not null
    and p.tipo_matricula = 'Matrícula'
  group by p.original_id_venda
)
select
  vf.original_id_venda,
  vf.consultor_id,
  cons.nome                                    as consultora,
  vf.data_pagamento,
  vf.valor,
  case
    when vf.tem_bom and not vf.tem_cartao      then 'verde'    -- só formas boas
    when vf.tem_cartao and not vf.tem_bom
         and vf.cartao_so_stone                then 'vermelho' -- 100% Stone
    when vf.tem_bom or vf.tem_cartao           then 'amarelo'  -- mistura / cartão não-100%-Stone
    else null                                                   -- só neutros: sem carinha
  end                                          as carinha
from venda_formas vf
join public.dim_consultores cons on cons.consultor_id = vf.consultor_id
where public.pode_ver('comercial');

-- ---------- Placar ACUMULADO com reset em 10 ----------
create or replace view public.vw_comercial_placar as
with contagem as (
  select
    c.consultor_id,
    c.consultora,
    cons.foto_url,
    count(*) filter (where c.carinha = 'verde')    as verdes_total,
    count(*) filter (where c.carinha = 'vermelho') as vermelhas_total,
    count(*) filter (where c.carinha = 'amarelo')  as amarelas_total
  from public.vw_comercial_carinhas c
  join public.dim_consultores cons on cons.consultor_id = c.consultor_id
  where cons.ativa = true
    and c.carinha is not null
  group by 1, 2, 3
)
select
  consultor_id,
  consultora,
  foto_url,
  verdes_total,
  vermelhas_total,
  amarelas_total,
  -- posição no ciclo atual (0-9), e quantos ciclos já fechou
  verdes_total % 10                    as verdes_no_ciclo,
  vermelhas_total % 10                 as vermelhas_no_ciclo,
  verdes_total / 10                    as brindes_ganhos,     -- nº de vezes que fechou 10 verdes
  vermelhas_total / 10                 as semanais_perdidas,  -- nº de vezes que fechou 10 vermelhas
  -- faltam quantas para o próximo prêmio/punição
  10 - (verdes_total % 10)             as faltam_brinde,
  10 - (vermelhas_total % 10)          as faltam_perder
from contagem
order by verdes_total desc, vermelhas_total asc;

grant select on
  public.vw_comercial_forma_tipo,
  public.vw_comercial_carinhas,
  public.vw_comercial_placar
to authenticated;
