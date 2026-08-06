-- ============================================================
-- FebraHub · REBUILD COMPLETO DAS VIEWS
--
-- Rode este arquivo inteiro sempre que precisar alterar a
-- vw_venda_faturamento. Ela é a base de doze views, e qualquer
-- drop cascade nela derruba todas as demais.
--
-- Ordem embutida: 26 -> 27 -> 25 -> 28 -> 33 -> 34
--
-- NÃO sobrescreve as abreviações (nome_curto) da dim_cursos —
-- elas são mantidas por update manual.
-- ============================================================



-- ############ 26_nome_curto_pmc.sql ############
-- ============================================================
-- FebraHub · Migration 26 — Nome curto dos cursos, PMC01 e hover no Geral
--
-- 1) dim_cursos ganha nome_curto (abreviação para o hover do ranking).
--    Ajuste livremente: é só texto de exibição, não afeta cálculo.
-- 2) PMC (Programa Multiplicador de Crescimento) vira Evento. Não tem
--    matrícula na base de alunos, então categoria e nome do curso são
--    resolvidos pelo código do nome_venda, não pela dim_cursos.
-- 3) O hover de cursos passa a funcionar também no modo Geral (todas as
--    categorias), não só GGB.
-- 4) REVOLUTION (CIS Revolution) entra com receita zero para a unidade,
--    como o METODO CIS GLOBAL HOLDING: a venda fica com a consultora
--    (bruto no Comercial), mas o valor é integralmente repassado.
-- ============================================================

alter table public.dim_cursos add column if not exists nome_curto text;

-- ATENÇÃO: o bloco que gerava as abreviações automaticamente foi REMOVIDO.
-- Ele sobrescrevia as siglas oficiais definidas manualmente (FCIS, BHP, IF,
-- TV, MASTER, ML5, FGPC, FOP, TCE, PE, Growth) toda vez que a migration
-- rodava de novo. As abreviações agora são mantidas só por update manual.

-- fallback: quem ficou sem abreviação usa o nome completo
update public.dim_cursos set nome_curto = curso_id where nome_curto is null;

-- ------------------------------------------------------------
-- vw_venda_faturamento: categoria por código do nome_venda quando
-- a venda não tem matrícula (órfãs). Hoje só PMC01 -> Evento.
-- ------------------------------------------------------------
drop view if exists public.vw_venda_faturamento cascade;
create view public.vw_venda_faturamento as
with venda_valor as (
  select
    p.original_id_venda,
    max(p.consultor_id)   as consultor_id,
    max(p.data_pagamento) as data_pagamento,
    max(p.valor)          as valor,
    max(p.tipo_matricula) as tipo_matricula,
    max(p.nome_venda)     as nome_venda
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
),
base as (
  select
    vv.original_id_venda, vv.consultor_id, vv.data_pagamento,
    vv.tipo_matricula, vv.nome_venda,
    cur.curso_id, cur.tipo as tipo_curso, cur.nome_curso, cur.nome_curto,
    vv.valor as valor_bruto
  from venda_valor vv
  left join matricula_da_venda m on m.original_id_venda = vv.original_id_venda
  left join public.dim_cursos cur on cur.curso_id = m.curso_id
)
select
  b.original_id_venda,
  b.consultor_id,
  b.data_pagamento,
  b.tipo_matricula,
  -- categoria: da dim_cursos; se órfã, tenta pelo código do nome_venda
  coalesce(
    b.tipo_curso,
    case when split_part(b.nome_venda,' - ',2) like 'PMC%' then 'Evento' end,
    'Sem categoria'
  )                                            as categoria_curso,
  coalesce(
    b.nome_curso,
    case when split_part(b.nome_venda,' - ',2) like 'PMC%'
         then 'Programa Multiplicador de Crescimento' end,
    'Sem vínculo'
  )                                            as curso,
  coalesce(
    b.nome_curto, b.nome_curso,
    case when split_part(b.nome_venda,' - ',2) like 'PMC%' then 'PMC' end,
    'Sem vínculo'
  )                                            as curso_curto,
  case
    when b.curso_id in ('METODO CIS GLOBAL HOLDING','REVOLUTION') then 0.0
    when b.curso_id in ('METODO CIS GLOBAL',
                        'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL') then
         case when b.data_pagamento < '2023-01-01' then 0.20
              when b.data_pagamento < '2026-06-01' then 0.50
              else 0.80 end
    when b.curso_id in ('TEAM COACHING BUSINESS','TEAM COACHING LIFE') then 0.50
    when b.tipo_curso = 'Coaching Individual'                  then 0.50
    else 1.0
  end                                          as pct_unidade,
  b.valor_bruto,
  b.valor_bruto *
  case
    when b.curso_id in ('METODO CIS GLOBAL HOLDING','REVOLUTION') then 0.0
    when b.curso_id in ('METODO CIS GLOBAL',
                        'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL',
                        'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL') then
         case when b.data_pagamento < '2023-01-01' then 0.20
              when b.data_pagamento < '2026-06-01' then 0.50
              else 0.80 end
    when b.curso_id in ('TEAM COACHING BUSINESS','TEAM COACHING LIFE') then 0.50
    when b.tipo_curso = 'Coaching Individual'                  then 0.50
    else 1.0
  end                                          as valor
from base b;

grant select on public.vw_venda_faturamento to authenticated;

-- ------------------------------------------------------------
-- Hover de cursos: todas as categorias (funciona também no Geral)
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


-- ############ 27_views_comercial_final.sql ############
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


-- ############ 25_views_financeiro.sql ############
-- ============================================================
-- FebraHub · Migration 25 — Views do Financeiro corrigidas
--
-- PROBLEMAS CORRIGIDOS:
--  1) Somavam p.valor por linha do fato_pagamento_base, que tem 1 linha
--     por FORMA DE PAGAMENTO -> venda contada N vezes.
--  2) Faziam LEFT JOIN fato_base_alunos sem deduplicar -> vendas que
--     geram várias matrículas (comprador + consumidores) contadas de novo.
--  3) Ignoravam COMPRADOR DE VAGAS (R$11,4M de receita fora da conta).
--  4) Aplicavam split só no Coaching Individual, sem as regras do
--     CIS Global (20/50/80 por faixa) e das mentorias TCB/TCL (50%).
--  5) vw_financeiro_receita não filtrava tipo_matricula: somava Bônus,
--     Cortesia etc. como receita.
--
-- SOLUÇÃO: todas passam a ler de vw_venda_faturamento (migration 24),
-- que já entrega 1 linha por venda com valor_bruto, pct_unidade e valor.
--
-- NÃO MUDAM (corretas, 1 linha = 1 parcela real):
--   a_receber/a_pagar_horizonte, caixa_*, despesa_*, inadimplencia*,
--   mdr, pago_mensal, perdas_cartao, recebido_mensal.
-- ============================================================

-- ------------------------------------------------------------
-- RECEITA GERAL (curso + evento)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita cascade;
create view public.vw_financeiro_receita as
select
  date_trunc('month', f.data_pagamento)::date        as mes,
  coalesce(p.unidade_geradora_venda,'nao_informado') as unidade,
  'curso'::text                                      as tipo_receita,
  p.status_pagamento,
  p.forma_pagamento,
  count(*)                                           as transacoes,
  sum(f.valor_bruto)                                 as valor_bruto,
  sum(f.valor)                                       as valor_liquido
from public.vw_venda_faturamento f
join lateral (
  select unidade_geradora_venda, status_pagamento, forma_pagamento
  from public.fato_pagamento_base
  where original_id_venda = f.original_id_venda
  limit 1
) p on true
where public.pode_ver('financeiro')
group by 1,2,3,4,5
union all
select
  date_trunc('month', e.data_pedido)::date as mes,
  'eventos'::text                          as unidade,
  'evento'::text                           as tipo_receita,
  e.status_pedido                          as status_pagamento,
  e.forma_pagamento,
  count(*)                                 as transacoes,
  sum(e.valor_total)                       as valor_bruto,
  sum(e.valor_liquido)                     as valor_liquido
from public.fato_pedidos e
where public.pode_ver('financeiro')
group by 1,2,3,4,5;

grant select on public.vw_financeiro_receita to authenticated;

-- ------------------------------------------------------------
-- RECEITA POR CATEGORIA (mensal)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_categoria cascade;
create view public.vw_financeiro_receita_categoria as
select
  f.categoria_curso                          as categoria,
  date_trunc('month', f.data_pagamento)::date as mes,
  count(*)                                   as vendas,
  sum(f.valor_bruto)                         as receita_bruta,
  sum(f.valor)                               as receita_unidade,
  sum(f.valor_bruto - f.valor)               as repasse
from public.vw_venda_faturamento f
where public.pode_ver('financeiro')
group by 1,2;

grant select on public.vw_financeiro_receita_categoria to authenticated;

-- ------------------------------------------------------------
-- RECEITA POR CATEGORIA (com data, para filtro de período)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_categoria_periodo cascade;
create view public.vw_financeiro_receita_categoria_periodo as
select
  f.categoria_curso                          as categoria,
  date_trunc('month', f.data_pagamento)::date as mes,
  f.data_pagamento                           as data,
  count(*)                                   as vendas,
  sum(f.valor_bruto)                         as receita_bruta,
  sum(f.valor)                               as receita_unidade,
  sum(f.valor_bruto - f.valor)               as repasse
from public.vw_venda_faturamento f
where public.pode_ver('financeiro')
group by 1,2,3;

grant select on public.vw_financeiro_receita_categoria_periodo to authenticated;

-- ------------------------------------------------------------
-- RECEITA POR CATEGORIA (total acumulado, sem Bônus)
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_categoria_total cascade;
create view public.vw_financeiro_receita_categoria_total as
select
  f.categoria_curso              as categoria,
  count(*)                       as vendas,
  sum(f.valor_bruto)             as receita_bruta,
  sum(f.valor)                   as receita_unidade,
  sum(f.valor_bruto - f.valor)   as repasse
from public.vw_venda_faturamento f
where f.categoria_curso <> 'Bônus'
  and public.pode_ver('financeiro')
group by 1
order by 4 desc;

grant select on public.vw_financeiro_receita_categoria_total to authenticated;

-- ------------------------------------------------------------
-- RECEITA MENSAL
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_receita_mensal cascade;
create view public.vw_financeiro_receita_mensal as
select
  date_trunc('month', f.data_pagamento)::date as mes,
  sum(f.valor)                                as receita,
  sum(f.valor_bruto)                          as receita_bruta
from public.vw_venda_faturamento f
where public.pode_ver('financeiro')
group by 1
order by 1;

grant select on public.vw_financeiro_receita_mensal to authenticated;

-- ------------------------------------------------------------
-- FORMAS DE PAGAMENTO
-- Vendas com forma única recebem o valor da venda. Vendas pagas em
-- mais de uma forma vão para "Múltiplas formas": o dado não permite
-- saber quanto foi em cada uma (o valor total se repete nas linhas e
-- o valor_parcela não reconstrói o total quando há juros).
-- ------------------------------------------------------------
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
    when fv.forma_unica ilike '%cispay%' or fv.forma_unica ilike '%cielo%' then 'Cartão/PIX CisPay'
    when fv.forma_unica ilike '%boleto%'    then 'Boleto'
    when fv.forma_unica ilike '%transfer%'  then 'Transferência'
    when fv.forma_unica ilike '%dinheiro%'  then 'Dinheiro'
    when fv.forma_unica ilike '%credito de curso%' or fv.forma_unica ilike '%credito em curso%'
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

-- ------------------------------------------------------------
-- LÍQUIDO POR CURSO (liquidação de cartão)
-- O join com pagamento multiplicava cada liquidação pelo número de
-- formas da venda. Passa a usar vw_venda_faturamento (1 por venda).
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_liquido_por_curso cascade;
create view public.vw_financeiro_liquido_por_curso as
select
  date_trunc('month', l.data_venda)::date  as mes,
  coalesce(f.curso,'nao_determinado')      as curso,
  count(*)                                 as parcelas,
  sum(l.valor_bruto)                       as bruto,
  sum(l.valor_liquido)                     as liquido,
  sum(l.taxa_cispay)                       as taxa_cartao
from public.fato_liquidacao_cartao l
left join public.vw_venda_faturamento f on f.original_id_venda = l.cod_salesforce
where public.pode_ver('financeiro')
  and l.tipo_transacao = 'Credit'
  and l.data_venda is not null
group by 1,2;

grant select on public.vw_financeiro_liquido_por_curso to authenticated;

-- ------------------------------------------------------------
-- QUALIDADE — passa a medir por venda, não por linha
-- ------------------------------------------------------------
drop view if exists public.vw_financeiro_qualidade cascade;
create view public.vw_financeiro_qualidade as
select
  count(*)                                                   as total,
  count(*) filter (where data_pagamento is null)             as sem_data,
  sum(valor) filter (where data_pagamento is null)           as valor_sem_data,
  count(*) filter (where status_pagamento is null)           as sem_status,
  round(100.0 * count(*) filter (where status_pagamento is null)
        / nullif(count(*),0), 1)                             as pct_sem_status
from (
  select original_id_venda,
         max(data_pagamento)   as data_pagamento,
         max(valor)            as valor,
         max(status_pagamento) as status_pagamento
  from public.fato_pagamento_base
  group by original_id_venda
) v
where public.pode_ver('financeiro');

grant select on public.vw_financeiro_qualidade to authenticated;


-- ############ 28_detalhe_carinhas_verdes.sql ############
-- ============================================================
-- FebraHub · Migration 28 — Detalhamento das vendas com carinha verde
--
-- Pedido da gestora do financeiro: ver venda a venda quais foram as
-- verdes, com link direto para o Salesforce e as formas de pagamento
-- que compuseram cada uma (a classificação fica auditável).
--
-- Escopo: as 3 consultoras GGB, desde a largada da gamificação (jan/2025).
-- Verde = todas as formas da venda são "boas" (Pix, transferência,
-- dinheiro, cheque), ignorando as neutras (boleto, crédito de curso).
-- ============================================================

drop view if exists public.vw_comercial_verdes_detalhe cascade;
create view public.vw_comercial_verdes_detalhe as
select
  c.data_pagamento                          as data,
  c.consultora,
  cons.foto_url,
  -- o nome_venda vem como "ANO - CÓDIGO - CLIENTE"
  nullif(split_part(p.nome_venda, ' - ', 3), '')  as cliente,
  split_part(p.nome_venda, ' - ', 2)              as codigo_turma,
  coalesce(f.curso_curto, f.curso)                as curso,
  f.categoria_curso                               as categoria,
  round(c.valor)                                  as valor,
  -- todas as formas que compuseram a venda
  p.formas,
  p.n_formas,
  c.original_id_venda,
  'https://febracis.lightning.force.com/lightning/r/Opportunity/'
    || c.original_id_venda || '/view'              as link_salesforce
from public.vw_comercial_carinhas c
join public.dim_consultores cons on cons.consultor_id = c.consultor_id
left join public.vw_venda_faturamento f on f.original_id_venda = c.original_id_venda
left join lateral (
  select string_agg(distinct forma_pagamento, ' + ' order by forma_pagamento) as formas,
         count(distinct forma_pagamento)                                      as n_formas,
         max(nome_venda)                                                      as nome_venda
  from public.fato_pagamento_base
  where original_id_venda = c.original_id_venda
) p on true
where c.carinha = 'verde'
  and c.data_pagamento >= '2025-01-01'
  and c.consultor_id in (
    'Alana Faleiro Coutinho',
    'Beatriz Souza',
    'Beatriz Martins de Novaes'
  );

grant select on public.vw_comercial_verdes_detalhe to authenticated;

-- NOTA front: filtrar por período (data) e por consultora.
-- `link_salesforce` abre a oportunidade direto no Salesforce.
-- `formas` mostra o que compôs a venda — é o que torna a
-- classificação auditável pela gestora.


-- ############ 33_conciliacao_ajustada.sql ############
-- ============================================================
-- FebraHub · Migration 33 — Conciliação CisPay ajustada
--
-- Correções sobre a 32:
--   1) exclui status Negado/Cancelado — pagamento negado não tem
--      liquidação por definição, não é divergência
--   2) agrupa por VENDA, não por linha (vendas com várias formas
--      apareciam repetidas)
--   3) marca como 'fora_do_periodo' o que é anterior a ago/2024,
--      quando a liquidação da CisPay começa — não há como conciliar
--
-- Divergências reais (ago/2024 em diante, excluindo negados):
--   829 vendas, R$3,2 milhões
--
-- Observação de negócio: as divergências se concentram em vendas de
-- alto valor (R$40k a R$120k). Provável que sejam registradas como
-- CisPay no Salesforce mas pagas por transferência — ou seja,
-- classificação imprecisa da forma, não dinheiro faltando.
-- ============================================================

drop view if exists public.vw_financeiro_conciliacao_cispay cascade;
create view public.vw_financeiro_conciliacao_cispay as
with venda as (
  -- 1 linha por venda
  select
    original_id_venda,
    max(payment_id)             as payment_id,
    max(data_pagamento)         as data_pagamento,
    max(valor)                  as valor,
    max(nome_venda)             as nome_venda,
    max(consultor_id)           as consultor_id,
    max(tipo_matricula)         as tipo_matricula,
    max(status_pagamento)       as status_pagamento,
    string_agg(distinct forma_pagamento, ' + ') as formas
  from public.fato_pagamento_base
  where forma_pagamento ilike '%cispay%'
  group by original_id_venda
),
liq as (
  select pagamento_cartao_id,
         count(*)             as parcelas,
         sum(valor_bruto)     as bruto,
         sum(valor_liquido)   as liquido,
         sum(taxa_cispay)     as taxa,
         min(data_liquidacao) as primeira_liquidacao,
         max(data_liquidacao) as ultima_liquidacao
  from public.fato_liquidacao_cartao
  where tipo_transacao = 'Credit'
  group by pagamento_cartao_id
)
select
  v.original_id_venda,
  v.payment_id,
  v.data_pagamento,
  nullif(split_part(v.nome_venda,' - ',3),'') as cliente,
  v.nome_venda,
  v.consultor_id,
  v.tipo_matricula,
  v.status_pagamento,
  v.formas,
  round(v.valor)        as valor_salesforce,
  round(l.bruto)        as valor_cispay,
  round(l.liquido)      as liquido_cispay,
  round(l.taxa)         as taxa_cispay,
  l.parcelas,
  l.primeira_liquidacao,
  l.ultima_liquidacao,
  case
    when coalesce(v.status_pagamento,'') in ('Negado','Cancelado') then 'nao_aplicavel'
    when v.payment_id is null or v.payment_id = ''                 then 'sem_payment_id'
    when l.pagamento_cartao_id is not null                         then 'conciliado'
    when v.data_pagamento < '2024-08-01'                           then 'fora_do_periodo'
    else 'divergencia'
  end                   as situacao,
  'https://febracis.lightning.force.com/lightning/r/Opportunity/'
    || v.original_id_venda || '/view' as link_salesforce
from venda v
left join liq l on l.pagamento_cartao_id = v.payment_id
where public.pode_ver('financeiro');

grant select on public.vw_financeiro_conciliacao_cispay to authenticated;

-- Resumo por mês e situação
drop view if exists public.vw_financeiro_conciliacao_resumo cascade;
create view public.vw_financeiro_conciliacao_resumo as
select
  date_trunc('month', data_pagamento)::date as mes,
  situacao,
  count(*)                                  as vendas,
  round(sum(valor_salesforce))              as valor
from public.vw_financeiro_conciliacao_cispay
group by 1,2
order by 1 desc, 4 desc;

grant select on public.vw_financeiro_conciliacao_resumo to authenticated;

notify pgrst, 'reload schema';


-- ############ 34_leads_salvador.sql ############
-- ============================================================
-- FebraHub · Migration 34 — Leads da unidade Salvador
--
-- O Clint atendia Salvador e Recife na mesma conta. O filtro é por
-- consultor, não por nome de campanha — 5.797 leads não trazem praça
-- no nome, então o critério por campanha seria impreciso.
--
-- ATENÇÃO: o CRM está sendo trocado (julho/2026). Esta view tem prazo
-- curto; a parte estável do Hub Marketing é o investimento do Meta,
-- que independe de CRM.
--
-- Limitação conhecida: todos os status_negocio estão como OPEN — o
-- Clint não registra desfecho. Dá para medir leads e etapa, não
-- conversão em venda.
-- ============================================================

-- Consultoras da unidade Salvador (ids do Clint)
create table if not exists public.consultor_unidade (
  consultor_id text primary key,
  nome         text,
  unidade      text not null
);

delete from public.consultor_unidade;
insert into public.consultor_unidade (consultor_id, nome, unidade) values
  ('fb96cdf3-9dc5-473a-8309-1de2fe52c5e1','MARLANY BONA',              'Salvador'),
  ('405388cb-096b-4fb0-9514-46fae5c1cc4d','Cássia Romão',              'Salvador'),
  ('3f0da964-27b9-49af-9f62-bc927dae6ff4','Alana Faleiro',             'Salvador'),
  ('77dd1a6c-d036-495c-9153-0e81e751bba8','Jennifer Mota',             'Salvador'),
  ('1e40d21e-eb01-4172-8b45-5bb70355ffe5','Bianca Nascimento',         'Salvador'),
  ('3a9df7de-0854-42dc-948b-e0af1bd31b92','Beatriz Souza',             'Salvador'),
  ('7db3a65d-b0f5-4cb1-af58-4fd613166d61','Beatriz Martins de Novaes', 'Salvador');

grant select on public.consultor_unidade to authenticated;

-- ------------------------------------------------------------
-- Leads de Salvador, com campanha normalizada
-- ------------------------------------------------------------
drop view if exists public.vw_marketing_leads cascade;
create view public.vw_marketing_leads as
select
  l.negocio_id,
  l.lead_id,
  l.data_criacao,
  date_trunc('month', l.data_criacao)::date  as mes,
  l.consultor_id,
  cu.nome                                    as consultora,
  l.nome_campanha,
  l.id_anuncio,
  l.nome_anuncio,
  l.nome_formulario,
  l.aplicativo_origem,
  -- etapa normalizada (o Clint tem a mesma etapa em várias grafias)
  initcap(trim(regexp_replace(l.etapa_funil, '\s+', ' ', 'g'))) as etapa,
  l.status_negocio,
  -- produto extraído do padrão [PRODUTO][TIPO][MÊS] PRAÇA
  nullif(trim(both '[]' from split_part(l.nome_campanha, ']', 1)), '') as produto_campanha
from public.fato_negocio_lead l
join public.consultor_unidade cu on cu.consultor_id = l.consultor_id
where cu.unidade = 'Salvador'
  and public.pode_ver('marketing');

grant select on public.vw_marketing_leads to authenticated;

-- ------------------------------------------------------------
-- Leads por campanha e mês — base do custo por lead
-- ------------------------------------------------------------
drop view if exists public.vw_marketing_leads_campanha cascade;
create view public.vw_marketing_leads_campanha as
select
  mes,
  nome_campanha,
  produto_campanha,
  id_anuncio,
  aplicativo_origem,
  count(*)                    as leads,
  count(distinct consultora)  as consultoras
from public.vw_marketing_leads
where nome_campanha is not null and nome_campanha <> ''
group by 1,2,3,4,5;

grant select on public.vw_marketing_leads_campanha to authenticated;

-- ------------------------------------------------------------
-- Distribuição por etapa do funil
-- ------------------------------------------------------------
drop view if exists public.vw_marketing_funil cascade;
create view public.vw_marketing_funil as
select
  mes,
  etapa,
  consultora,
  count(*) as leads
from public.vw_marketing_leads
group by 1,2,3;

grant select on public.vw_marketing_funil to authenticated;

notify pgrst, 'reload schema';


notify pgrst, 'reload schema';
