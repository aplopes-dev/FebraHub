-- ============================================================
-- FebraHub · Migration 55 — Cursos premium e outras receitas da loja
--
-- Fontes novas da receita da loja:
--   cursos premium  -> planilha CURSOS PREMIUM LOJA (abas por ano)
--   sentido brincar -> planilha própria (produto avulso)
--   livrão          -> Salesforce (nome_venda like 'LIVRAO%'), valor cheio
--
-- Estrutura única, com a coluna 'fonte' distinguindo a origem.
-- ============================================================

create table if not exists public.fato_loja_receita_extra (
  id             bigserial primary key,
  fonte          text not null,        -- 'curso_premium' | 'sentido_brincar' | 'livrao'
  data_venda     date,
  mes_ref        date,
  descricao      text,                 -- curso ou produto
  forma_pagto    text,
  valor          numeric,
  quantidade     numeric default 1,
  cliente        text,
  documento      text,
  observacao     text,
  chave_origem   text,                 -- para deduplicar no upsert
  atualizado_em  timestamptz default now(),
  unique (fonte, chave_origem)
);
grant select on public.fato_loja_receita_extra to authenticated;

-- ---------- Livrão (Salesforce) ----------
drop view if exists public.vw_loja_livrao cascade;
create view public.vw_loja_livrao as
select
  date_trunc('month', v.data_pagamento)::date as mes_ref,
  count(distinct v.original_id_venda)         as vendas,
  round(sum(v.valor_bruto))                   as valor
from public.vw_venda_faturamento v
where exists (
  select 1 from public.fato_pagamento_base p
  where p.original_id_venda = v.original_id_venda
    and p.nome_venda ilike '%LIVRAO%'
)
group by 1;
grant select on public.vw_loja_livrao to authenticated;

-- ---------- Receita consolidada da loja ----------
-- Omie (PDV) + livrão (Salesforce) + extras (planilhas)
drop view if exists public.vw_loja_receita_consolidada cascade;
create view public.vw_loja_receita_consolidada as
with pdv as (
  select date_trunc('month', data_emissao)::date as mes,
         'PDV (produtos)'::text as fonte,
         count(*) as vendas, sum(valor) as valor
  from public.fato_loja_cupom
  where not cancelado and data_emissao is not null
  group by 1
),
livrao as (
  select mes_ref as mes, 'Livrão'::text as fonte, vendas, valor::numeric
  from public.vw_loja_livrao
),
extra as (
  select mes_ref as mes,
         case fonte
           when 'curso_premium'   then 'Cursos premium'
           when 'sentido_brincar' then 'Sentido de Brincar'
           else initcap(replace(fonte,'_',' '))
         end as fonte,
         count(*) as vendas, sum(valor) as valor
  from public.fato_loja_receita_extra
  where mes_ref is not null
  group by 1, 2
)
select mes, fonte, vendas, round(valor) as valor
from (
  select * from pdv
  union all select * from livrao
  union all select * from extra
) t
where public.pode_ver('loja')
order by mes desc, valor desc;
grant select on public.vw_loja_receita_consolidada to authenticated;

-- ---------- Total consolidado por mês ----------
drop view if exists public.vw_loja_receita_total_mes cascade;
create view public.vw_loja_receita_total_mes as
select
  mes,
  sum(vendas)  as vendas,
  sum(valor)   as receita_total,
  sum(valor) filter (where fonte = 'PDV (produtos)') as receita_pdv,
  sum(valor) filter (where fonte <> 'PDV (produtos)') as receita_outras
from public.vw_loja_receita_consolidada
group by 1
order by 1;
grant select on public.vw_loja_receita_total_mes to authenticated;

notify pgrst, 'reload schema';
