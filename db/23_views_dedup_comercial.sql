-- ============================================================
-- FebraHub · Migration 23 — Views do Comercial com faturamento deduplicado
--
-- CONTEXTO: o fato_pagamento_base tem 1 linha por FORMA DE PAGAMENTO.
-- Vendas pagas em várias formas repetem o valor total em cada linha.
-- Somar valor cru inflava o faturamento (~2x). Validado contra o
-- financeiro: maio/2026 dedup = R$1.779.136 (financeiro R$1.699.375).
--
-- REGRA DE FATURAMENTO (validada com o financeiro):
--   Receita: 'Matrícula', 'COMPRADOR DE VAGAS', 'MAT. RETROATIVA'
--   NÃO é receita: CONSUMIDOR DE VAGAS (R$0, é o aluno), Bônus, Cortesia
--
-- REGRA DE ALUNO/MATRÍCULA (contagem):
--   'Matrícula' e 'CONSUMIDOR DE VAGAS' (quem estuda)
--   COMPRADOR DE VAGAS não conta como aluno (comprou para outro)
--
-- NÃO MUDA: as carinhas continuam lendo do fato cru, pois dependem
-- das múltiplas linhas por forma de pagamento.
-- ============================================================

-- ------------------------------------------------------------
-- FONTE ÚNICA: 1 linha por venda, valor correto, categoria e split
-- ------------------------------------------------------------
-- A view vw_venda_faturamento é criada na migration 24 (com o split
-- do CIS Global por faixa de data). Rode a 24 ANTES desta.

-- ------------------------------------------------------------
-- 1. RANKING POR CATEGORIA (GGB / CIS / CI)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_ranking_categoria cascade;
create view public.vw_comercial_ranking_categoria as
select
  vc.categoria,
  f.consultor_id,
  cons.nome        as consultora,
  cons.foto_url,
  f.data_pagamento as data,
  f.valor
from public.vw_venda_faturamento f
join public.consultora_categoria vc
     on vc.consultor_id = f.consultor_id
    and (
      (vc.categoria = 'GGB' and f.categoria_curso = 'GGB') or
      (vc.categoria = 'CIS' and f.categoria_curso = 'CIS') or
      (vc.categoria = 'CI'  and f.categoria_curso = 'Coaching Individual')
    )
join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where (vc.largada is null or f.data_pagamento >= vc.largada)
  and public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_categoria to authenticated;

-- ------------------------------------------------------------
-- 2. RANKING HISTÓRICO (quem vendeu no período; ex-consultor sem foto)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_ranking_historico cascade;
create view public.vw_comercial_ranking_historico as
select
  case f.categoria_curso
    when 'GGB' then 'GGB'
    when 'CIS' then 'CIS'
    when 'Coaching Individual' then 'CI'
  end                    as categoria,
  f.data_pagamento       as data,
  f.valor,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then 'Danilo'
    else f.consultor_id
  end                    as consultor_id_exibicao,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then 'Danilo'
    else coalesce(cons.nome, f.consultor_id)
  end                    as consultora,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then null
    when cons.ativa then cons.foto_url
    else null
  end                    as foto_url,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then false
    when cons.ativa then true
    else false
  end                    as atual
from public.vw_venda_faturamento f
left join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where f.categoria_curso in ('GGB','CIS','Coaching Individual')
  and public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_historico to authenticated;

-- ------------------------------------------------------------
-- 3. RANKING GERAL CONSOLIDADO (Dulce: GGB+CI+CIS, sem Sympla)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_ranking_geral_consolidado cascade;
create view public.vw_comercial_ranking_geral_consolidado as
select
  f.data_pagamento as data,
  f.valor,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then 'Danilo'
    else coalesce(cons.nome, f.consultor_id)
  end              as consultora,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then null
    when cons.ativa then cons.foto_url
    else null
  end              as foto_url,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then false
    when cons.ativa then true
    else false
  end              as atual
from public.vw_venda_faturamento f
left join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where f.categoria_curso in ('GGB','CIS','Coaching Individual')
  and public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_geral_consolidado to authenticated;

-- ------------------------------------------------------------
-- 4. MATRÍCULAS vs FATURAMENTO
--    faturamento = venda deduplicada (inclui comprador de vaga)
--    matriculas  = só quem estuda (Matrícula + CONSUMIDOR DE VAGAS)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_matriculas_faturamento cascade;
create view public.vw_comercial_matriculas_faturamento as
select
  case f.categoria_curso
    when 'GGB' then 'GGB'
    when 'CIS' then 'CIS'
    when 'Coaching Individual' then 'CI'
  end                                            as categoria,
  date_trunc('month', f.data_pagamento)::date    as mes,
  f.data_pagamento                               as data,
  f.valor,
  -- 1 quando a venda representa um aluno; 0 quando é só compra de vaga
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula
from public.vw_venda_faturamento f
where f.categoria_curso in ('GGB','CIS','Coaching Individual')
  and public.pode_ver('comercial');

grant select on public.vw_comercial_matriculas_faturamento to authenticated;

-- ------------------------------------------------------------
-- 5. GERAL MENSAL (KPIs e gráficos no modo Geral)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_geral_mensal cascade;
create view public.vw_comercial_geral_mensal as
select
  date_trunc('month', f.data_pagamento)::date    as mes,
  f.data_pagamento                               as data,
  f.valor,
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula
from public.vw_venda_faturamento f
where f.categoria_curso in ('GGB','CIS','Coaching Individual')
  and public.pode_ver('comercial');

grant select on public.vw_comercial_geral_mensal to authenticated;

-- ------------------------------------------------------------
-- 6. CURSOS POR CONSULTORA (hover do ranking)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_cursos_por_consultora cascade;
create view public.vw_comercial_cursos_por_consultora as
select
  case f.categoria_curso
    when 'GGB' then 'GGB'
    when 'CIS' then 'CIS'
    when 'Coaching Individual' then 'CI'
  end              as categoria,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then 'Danilo'
    else coalesce(cons.nome, f.consultor_id)
  end              as consultora,
  f.curso,
  f.data_pagamento as data,
  f.valor
from public.vw_venda_faturamento f
left join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where f.categoria_curso in ('GGB','CIS','Coaching Individual')
  and public.pode_ver('comercial');

grant select on public.vw_comercial_cursos_por_consultora to authenticated;

-- ------------------------------------------------------------
-- 7. RANKING PERÍODO / GERAL (pódio com toggle)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_ranking_periodo cascade;
create view public.vw_comercial_ranking_periodo as
select
  f.consultor_id,
  cons.nome        as consultora,
  cons.foto_url,
  f.data_pagamento as data,
  f.valor
from public.vw_venda_faturamento f
join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where cons.ativa
  and public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_periodo to authenticated;

drop view if exists public.vw_comercial_ranking_geral cascade;
create view public.vw_comercial_ranking_geral as
select
  f.consultor_id,
  cons.nome                    as consultora,
  cons.foto_url,
  count(*)                     as vendas,
  round(sum(f.valor))          as receita,
  round(avg(f.valor))          as ticket_medio,
  min(f.data_pagamento)        as primeira_venda
from public.vw_venda_faturamento f
join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where cons.ativa
  and public.pode_ver('comercial')
group by 1,2,3
order by receita desc;

grant select on public.vw_comercial_ranking_geral to authenticated;
