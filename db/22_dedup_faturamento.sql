-- ============================================================
-- FebraHub · Migration 22 — Correção de faturamento (dedup + comprador de vaga)
--
-- PROBLEMA CORRIGIDO: o fato_pagamento_base tem uma linha por FORMA DE
-- PAGAMENTO. Uma venda parcelada em várias formas repete o valor total
-- em cada linha. Somar valor cru INFLAVA o faturamento (~2x).
--
-- Validado contra o financeiro: maio/2026 dedup = R$1.779.136 (financeiro
-- R$1.699.375). O método correto é: 1 valor por venda (max), não somar linhas.
--
-- REGRA DE FATURAMENTO (validada):
--   Conta como receita: 'Matrícula', 'COMPRADOR DE VAGAS', 'MAT. RETROATIVA'
--   NÃO conta: CONSUMIDOR DE VAGAS (R$0, é o aluno), Bônus, Cortesia, etc.
--
-- Esta view entrega 1 LINHA POR VENDA com o valor correto e a categoria.
-- As views de faturamento passam a ler DELA em vez do fato_pagamento_base.
-- (As carinhas continuam lendo do fato cru, pois precisam das formas.)
-- ============================================================

drop view if exists public.vw_venda_faturamento cascade;
create view public.vw_venda_faturamento as
with venda_valor as (
  -- 1 valor por venda (dedup): pega o valor da venda uma vez
  select
    p.original_id_venda,
    max(p.consultor_id)          as consultor_id,
    max(p.data_pagamento)        as data_pagamento,
    max(p.valor)                 as valor,          -- valor da venda (não soma linhas)
    max(p.tipo_matricula)        as tipo_matricula
  from public.fato_pagamento_base p
  where p.tipo_matricula in ('Matrícula','COMPRADOR DE VAGAS','MAT. RETROATIVA')
    and p.valor is not null
  group by p.original_id_venda
)
select
  vv.original_id_venda,
  vv.consultor_id,
  vv.data_pagamento,
  vv.tipo_matricula,
  cur.tipo                       as categoria_curso,
  -- split 50/50 no Coaching Individual
  case when cur.tipo = 'Coaching Individual'
       then vv.valor * 0.5 else vv.valor end as valor
from venda_valor vv
join public.fato_base_alunos m on m.original_id_venda = vv.original_id_venda
join public.dim_cursos cur       on cur.curso_id = m.curso_id;

grant select on public.vw_venda_faturamento to authenticated;

-- NOTA: esta view é a FONTE ÚNICA de faturamento deduplicado.
-- categoria_curso = GGB/CIS/Coaching Individual/Evento/etc (tipo do dim_cursos)
-- valor = já com split no CI, 1 por venda (sem duplicação)
-- Filtrar por categoria_curso + data_pagamento conforme necessário.
