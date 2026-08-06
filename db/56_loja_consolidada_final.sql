-- ============================================================
-- FebraHub · Migration 56 — Receita consolidada da loja (oficial)
--
-- A receita da loja passa a somar TODAS as fontes:
--   Produtos          -> cupom fiscal do Omie (PDV) — ~91% do total
--   Livrão            -> Salesforce (nome_venda like 'LIVRAO%'), valor cheio
--   Cursos premium    -> planilha CURSOS PREMIUM LOJA
--   Aluguel de sala   -> planilhas de aluguel
--   Sentido de Brincar-> planilha própria
--
-- A meta da gestora considera todas essas fontes (confirmado), então o
-- comparativo agora é justo: junho passou de 64% para 91%, abril de
-- 57% para 85%.
--
-- CORTE EM MARÇO/2025: o Omie só começou em 29/03/2025. Janeiro e
-- fevereiro de 2025 têm só as fontes secundárias e mostrariam uma
-- queda falsa (R$297 e R$4.241). A série começa quando o dado fica
-- completo.
-- ============================================================

drop view if exists public.vw_loja_receita_consolidada cascade;
create view public.vw_loja_receita_consolidada as
with produtos as (
  select date_trunc('month', data_emissao)::date as mes,
         'Produtos'::text as fonte,
         count(*)::bigint as vendas, sum(valor) as valor
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
  group by 1
),
livrao as (
  select date_trunc('month', v.data_pagamento)::date as mes,
         'Livrão'::text as fonte,
         count(distinct v.original_id_venda)::bigint as vendas,
         sum(v.valor_bruto) as valor
  from public.vw_venda_faturamento v
  where exists (
    select 1 from public.fato_pagamento_base p
    where p.original_id_venda = v.original_id_venda
      and p.nome_venda ilike '%LIVRAO%')
  group by 1
),
extra as (
  select mes_ref as mes,
         case fonte
           when 'curso_premium'   then 'Cursos premium'
           when 'aluguel_sala'    then 'Aluguel de sala'
           when 'sentido_brincar' then 'Sentido de Brincar'
           else initcap(replace(fonte,'_',' '))
         end as fonte,
         count(*)::bigint as vendas, sum(valor) as valor
  from public.fato_loja_receita_extra
  where mes_ref is not null
  group by 1, 2
)
select mes, fonte, vendas, round(valor) as valor
from (
  select * from produtos
  union all select * from livrao
  union all select * from extra
) t
where mes >= '2025-03-01'          -- série começa quando o Omie entrou
  and public.pode_ver('loja')
order by mes desc, valor desc;
grant select on public.vw_loja_receita_consolidada to authenticated;

-- ---------- Total por mês, com meta e nível ----------
drop view if exists public.vw_loja_receita_total_mes cascade;
create view public.vw_loja_receita_total_mes as
with tot as (
  select mes,
         sum(vendas) as vendas,
         sum(valor)  as receita,
         sum(valor) filter (where fonte = 'Produtos')  as receita_produtos,
         sum(valor) filter (where fonte <> 'Produtos') as receita_outras
  from public.vw_loja_receita_consolidada
  group by 1
)
select
  t.mes,
  extract(year from t.mes)::int as ano,
  t.vendas,
  round(t.receita)          as receita,
  round(t.receita_produtos) as receita_produtos,
  round(coalesce(t.receita_outras,0)) as receita_outras,
  m.minima as meta_minima, m.basica as meta_basica, m.master as meta_master,
  case when coalesce(m.minima,0) > 0
       then round(100.0 * t.receita / m.minima, 1) end as pct_minima,
  case
    when coalesce(m.minima,0)=0 and coalesce(m.basica,0)=0
     and coalesce(m.master,0)=0                          then 'Sem meta'
    when coalesce(m.master,0) > 0 and t.receita >= m.master then 'Máster'
    when coalesce(m.basica,0) > 0 and t.receita >= m.basica then 'Básica'
    when coalesce(m.minima,0) > 0 and t.receita >= m.minima then 'Mínima'
    else 'Abaixo'
  end as nivel_atingido,
  (t.mes = date_trunc('month', current_date)::date) as em_curso
from tot t
left join public.fato_loja_meta_mes m on m.mes_ref = t.mes
order by t.mes;
grant select on public.vw_loja_receita_total_mes to authenticated;

notify pgrst, 'reload schema';
