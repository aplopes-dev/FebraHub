-- ============================================================
-- FebraHub · Migration 54 — Meta: nível batido + quanto falta
--
-- O percentual sozinho não comunica ("59%" de quê? bom? ruim?).
-- Agora a view diz explicitamente qual nível foi batido e quanto
-- falta em reais para o próximo, para o card falar frases como:
--   "Meta mínima batida · faltam R$ 5.000 para a básica"
--   "Abaixo · faltam R$ 10.800 para a mínima"
--   "Meta máster batida · superou em R$ 4.200"
-- ============================================================

drop view if exists public.vw_loja_kpis_mes cascade;
create view public.vw_loja_kpis_mes as
with base as (
  select date_trunc('month', data_emissao)::date as mes, valor
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
),
agg as (
  select
    b.mes,
    count(*)               as vendas,
    sum(b.valor)           as receita,
    round(avg(b.valor), 2) as ticket_medio,
    m.minima, m.basica, m.master
  from base b
  left join public.fato_loja_meta_mes m on m.mes_ref = b.mes
  group by b.mes, m.minima, m.basica, m.master
),
calc as (
  select *,
    case
      when coalesce(minima,0)=0 and coalesce(basica,0)=0
       and coalesce(master,0)=0                        then 'Sem meta'
      when coalesce(master,0) > 0 and receita >= master then 'Máster'
      when coalesce(basica,0) > 0 and receita >= basica then 'Básica'
      when coalesce(minima,0) > 0 and receita >= minima then 'Mínima'
      else 'Abaixo'
    end as nivel
  from agg
)
select
  mes,
  extract(year  from mes)::int as ano,
  extract(month from mes)::int as mes_num,
  vendas,
  round(receita)   as receita,
  ticket_medio,
  minima           as meta_minima,
  basica           as meta_basica,
  master           as meta_master,
  nivel            as nivel_atingido,

  -- percentual sobre o nível de referência (a mínima)
  case when coalesce(minima,0) > 0
       then round(100.0 * receita / minima, 1) end as pct_minima,

  -- qual é o próximo degrau
  case nivel
    when 'Abaixo' then 'Mínima'
    when 'Mínima' then 'Básica'
    when 'Básica' then 'Máster'
    else null
  end as proximo_nivel,

  -- quanto falta em reais para o próximo degrau
  round(case nivel
    when 'Abaixo' then greatest(minima - receita, 0)
    when 'Mínima' then greatest(basica - receita, 0)
    when 'Básica' then greatest(master - receita, 0)
    else null
  end) as falta_proximo,

  -- quando já bateu o topo, quanto superou
  case when nivel = 'Máster' then round(receita - master) end as excedeu_master,

  -- frase pronta, para o card não ter que montar a lógica
  case nivel
    when 'Sem meta' then 'Sem meta cadastrada'
    when 'Máster'   then 'Meta máster batida · superou em R$ '
                         || to_char(receita - master, 'FM999G999D00')
    when 'Básica'   then 'Meta básica batida · faltam R$ '
                         || to_char(master - receita, 'FM999G999D00') || ' para a máster'
    when 'Mínima'   then 'Meta mínima batida · faltam R$ '
                         || to_char(basica - receita, 'FM999G999D00') || ' para a básica'
    else                 'Abaixo da mínima · faltam R$ '
                         || to_char(minima - receita, 'FM999G999D00')
  end as resumo_meta,

  (mes = date_trunc('month', current_date)::date) as em_curso
from calc
where public.pode_ver('loja')
order by mes;

grant select on public.vw_loja_kpis_mes to authenticated;

notify pgrst, 'reload schema';
