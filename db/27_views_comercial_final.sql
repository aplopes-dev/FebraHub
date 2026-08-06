-- ============================================================
-- FebraHub · Migration 27 — Views do Comercial (SUBSTITUI a 23)
--
-- A partir daqui, NÃO rode mais a migration 23. Ela expunha só `valor`
-- e sobrescrevia o curso_curto criado na 26.
--
-- O que esta migration garante em todas as views do comercial:
--   valor_bruto  -> valor vendido (Comercial exibe este)
--   valor        -> após repasses (Financeiro exibe este)
--   curso_curto  -> abreviação para o hover
--   conta_matricula -> 1 = aluno, 0 = comprador de vaga
--
-- E o modo Geral passa a somar TODAS as categorias (inclui Mentoria,
-- Evento e Sem categoria), para reconciliar com o Financeiro.
--
-- Ordem de execução: 26 -> 27 -> 25
-- ============================================================

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
  f.valor_bruto,
  f.valor,
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula
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
-- 2. RANKING HISTÓRICO — todas as categorias, atuais e ex-consultores
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_ranking_historico cascade;
create view public.vw_comercial_ranking_historico as
select
  case f.categoria_curso
    when 'Coaching Individual' then 'CI'
    else f.categoria_curso
  end                    as categoria,
  f.data_pagamento       as data,
  f.valor_bruto,
  f.valor,
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula,
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
where public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_historico to authenticated;

-- ------------------------------------------------------------
-- 3. RANKING GERAL CONSOLIDADO — TODAS as categorias
--    (antes filtrava GGB/CIS/CI e não batia com o Financeiro)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_ranking_geral_consolidado cascade;
create view public.vw_comercial_ranking_geral_consolidado as
select
  f.data_pagamento as data,
  f.valor_bruto,
  f.valor,
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula,
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
where public.pode_ver('comercial');

grant select on public.vw_comercial_ranking_geral_consolidado to authenticated;

-- ------------------------------------------------------------
-- 4. MATRÍCULAS vs FATURAMENTO — todas as categorias
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_matriculas_faturamento cascade;
create view public.vw_comercial_matriculas_faturamento as
select
  case f.categoria_curso
    when 'Coaching Individual' then 'CI'
    else f.categoria_curso
  end                                            as categoria,
  date_trunc('month', f.data_pagamento)::date    as mes,
  f.data_pagamento                               as data,
  f.valor_bruto,
  f.valor,
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula
from public.vw_venda_faturamento f
where public.pode_ver('comercial');

grant select on public.vw_comercial_matriculas_faturamento to authenticated;

-- ------------------------------------------------------------
-- 5. GERAL MENSAL — TODAS as categorias (KPIs e gráficos do modo Geral)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_geral_mensal cascade;
create view public.vw_comercial_geral_mensal as
select
  date_trunc('month', f.data_pagamento)::date    as mes,
  f.data_pagamento                               as data,
  f.valor_bruto,
  f.valor,
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula
from public.vw_venda_faturamento f
where public.pode_ver('comercial');

grant select on public.vw_comercial_geral_mensal to authenticated;

-- ------------------------------------------------------------
-- 6. CURSOS POR CONSULTORA (hover) — com curso_curto e todas categorias
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_cursos_por_consultora cascade;
create view public.vw_comercial_cursos_por_consultora as
select
  case f.categoria_curso
    when 'Coaching Individual' then 'CI'
    else f.categoria_curso
  end              as categoria,
  case
    when f.consultor_id = 'Marlany Santos de Bona Fernandes'
         and f.data_pagamento < '2025-05-07' then 'Danilo'
    else coalesce(cons.nome, f.consultor_id)
  end              as consultora,
  f.curso,
  f.curso_curto,
  f.data_pagamento as data,
  f.valor_bruto,
  f.valor
from public.vw_venda_faturamento f
left join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where public.pode_ver('comercial');

grant select on public.vw_comercial_cursos_por_consultora to authenticated;

-- ------------------------------------------------------------
-- 7. PÓDIO: período (filtra) e geral (fixo)
-- ------------------------------------------------------------
drop view if exists public.vw_comercial_ranking_periodo cascade;
create view public.vw_comercial_ranking_periodo as
select
  f.consultor_id,
  cons.nome        as consultora,
  cons.foto_url,
  f.data_pagamento as data,
  f.valor_bruto,
  f.valor,
  case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end as conta_matricula
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
  round(sum(f.valor_bruto))    as receita_bruta,
  round(sum(f.valor))          as receita,
  round(avg(f.valor_bruto))    as ticket_medio,
  sum(case when f.tipo_matricula = 'COMPRADOR DE VAGAS' then 0 else 1 end) as matriculas,
  min(f.data_pagamento)        as primeira_venda
from public.vw_venda_faturamento f
join public.dim_consultores cons on cons.consultor_id = f.consultor_id
where cons.ativa
  and public.pode_ver('comercial')
group by 1,2,3
order by receita_bruta desc;

grant select on public.vw_comercial_ranking_geral to authenticated;
