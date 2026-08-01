-- Views reconstruídas a partir do DDL original.
--
-- Contexto: só 12 das 109 views do FebraHub estavam versionadas
-- (supabase/migrations/05 e 06). As outras foram criadas direto no SQL Editor
-- e o Supabase não devolve a definição delas — a sondagem em
-- tools/migracao/sondar_ddl.py registra as tentativas: o Data API expunha
-- apenas `public`, sem RPC de SQL e sem pg_graphql.
--
-- As que TÊM DDL entram aqui, como view de verdade sobre as tabelas base:
-- elas recomputam sozinhas quando os ETLs trazem dado novo. As demais
-- continuam como espelho de snapshot.* até serem reconstruídas, e
-- /api/health as reporta em `views_congeladas`.
--
-- Uma mudança em todas: sai o `where public.pode_ver('<setor>')`. A permissão
-- deixou de morar no SQL e passou para o SetorGuard da API, que responde 403 —
-- antes, quem não era do setor recebia zero linha, indistinguível de "não há
-- dado neste recorte".

-- ============================================================
-- CisPay: fluxo de caixa, custo de maquininha e perdas
-- (origem: supabase/migrations/06_cispay.sql)
-- ============================================================

-- O KPI que a Febracis não tinha: quanto entra, e quando. Direto da
-- adquirente, sem modelo e sem estatística.
DROP VIEW IF EXISTS public.vw_financeiro_caixa_horizonte CASCADE;
CREATE VIEW public.vw_financeiro_caixa_horizonte AS
SELECT
  CASE
    WHEN data_liquidacao <= current_date + 30 THEN '1 · até 30 dias'
    WHEN data_liquidacao <= current_date + 60 THEN '2 · 31 a 60 dias'
    WHEN data_liquidacao <= current_date + 90 THEN '3 · 61 a 90 dias'
    ELSE '4 · além de 90 dias'
  END                        AS horizonte,
  count(*)                   AS parcelas,
  sum(valor_liquido)         AS a_receber
FROM public.fato_liquidacao_cartao
WHERE data_liquidacao > current_date
  AND tipo_transacao = 'Credit'          -- exclui estorno e chargeback
GROUP BY 1
ORDER BY 1;

-- fato_pagamento_base conta o BRUTO, então toda margem calculada sobre ela
-- está otimista pela taxa de cartão inteira. Aqui a taxa aparece: 3,10%
-- medidos, o único número do projeto conferido contra a conta corrente.
DROP VIEW IF EXISTS public.vw_financeiro_mdr CASCADE;
CREATE VIEW public.vw_financeiro_mdr AS
SELECT
  date_trunc('month', data_venda)::date AS mes,
  bandeira,
  forma_pagamento,
  count(*)                              AS parcelas,
  sum(valor_bruto)                      AS bruto,
  sum(valor_liquido)                    AS liquido,
  sum(taxa_cispay)                      AS taxa,
  round(100.0 * sum(taxa_cispay) / nullif(sum(valor_bruto), 0), 2) AS pct_efetivo
FROM public.fato_liquidacao_cartao
WHERE data_venda IS NOT NULL
  AND tipo_transacao = 'Credit'
GROUP BY 1, 2, 3;

DROP VIEW IF EXISTS public.vw_financeiro_perdas_cartao CASCADE;
CREATE VIEW public.vw_financeiro_perdas_cartao AS
SELECT
  date_trunc('month', data_liquidacao)::date AS mes,
  tipo_transacao,
  count(*)                                   AS ocorrencias,
  abs(sum(valor_liquido))                    AS valor
FROM public.fato_liquidacao_cartao
WHERE tipo_transacao <> 'Credit'
GROUP BY 1, 2;

DROP VIEW IF EXISTS public.vw_financeiro_liquido_por_curso CASCADE;
CREATE VIEW public.vw_financeiro_liquido_por_curso AS
SELECT
  date_trunc('month', l.data_venda)::date   AS mes,
  coalesce(c.nome_curso, 'nao_determinado') AS curso,
  count(*)                                  AS parcelas,
  sum(l.valor_bruto)                        AS bruto,
  sum(l.valor_liquido)                      AS liquido,
  sum(l.taxa_cispay)                        AS taxa_cartao
FROM public.fato_liquidacao_cartao l
LEFT JOIN public.fato_pagamento_base p ON p.original_id_venda = l.cod_salesforce
LEFT JOIN public.mv_venda_curso v      ON v.original_id_venda = p.original_id_venda
LEFT JOIN public.dim_cursos c          ON c.curso_id = v.curso_id
WHERE l.tipo_transacao = 'Credit'
  AND l.data_venda IS NOT NULL
GROUP BY 1, 2;


-- ============================================================
-- Hubs (origem: supabase/migrations/05_rls_views_hubs.sql)
-- ============================================================

DROP VIEW IF EXISTS public.vw_comercial_funil CASCADE;
CREATE VIEW public.vw_comercial_funil AS
SELECT
  date_trunc('month', n.data_criacao)::date AS mes,
  n.etapa_funil,
  n.status_negocio,
  count(*)                                  AS negocios,
  count(*) FILTER (WHERE n.status_negocio ILIKE '%ganho%') AS ganhos,
  sum(n.valor)                              AS valor_total,
  avg(n.valor)                              AS ticket_medio
FROM public.fato_negocio_lead n
GROUP BY 1, 2, 3;

-- vw_financeiro_inadimplencia ficou de fora: a reconstrucao a partir da
-- migration 05 da 187 linhas contra 27 do snapshot. A view em producao
-- evoluiu depois (o projeto foi ate a 27a migration) e o DDL versionado e de
-- uma versao antiga. Reconstrucao que nao bate com o gabarito nao entra.
-- Segue como espelho, listada em views_congeladas.
-- DROP VIEW IF EXISTS public.vw_financeiro_inadimplencia CASCADE;
-- CREATE VIEW public.vw_financeiro_inadimplencia AS
-- SELECT
--   date_trunc('month', p.data_pagamento)::date AS mes,
--   p.status_pagamento,
--   count(*)                                    AS transacoes,
--   sum(p.valor)                                AS valor,
--   -- O PARTITION BY precisa repetir a expressão do GROUP BY *com* o ::date.
--   -- Sem o cast o Postgres não a reconhece como agrupada e recusa a window.
--   round(100.0 * sum(p.valor) / nullif(
--     sum(sum(p.valor)) OVER (PARTITION BY date_trunc('month', p.data_pagamento)::date), 0), 1
--   )                                           AS pct_do_mes
-- FROM public.fato_pagamento_base p
-- GROUP BY 1, 2;

-- Eventos: `count(distinct)` nos participantes é proposital. Participantes e
-- pedidos estão no mesmo FROM, e o produto cartesiano entre eles já inflou a
-- taxa do Sympla de R$ 17 mil para R$ 887 mil uma vez. Agregue antes de
-- juntar, nunca depois.
DROP VIEW IF EXISTS public.vw_eventos_desempenho CASCADE;
CREATE VIEW public.vw_eventos_desempenho AS
WITH participantes AS (
  SELECT evento_id,
         count(DISTINCT participante_id)                          AS ingressos,
         count(DISTINCT participante_id) FILTER (WHERE check_in)  AS compareceram
  FROM public.fato_participantes
  GROUP BY 1
),
pedidos AS (
  SELECT evento_id,
         sum(valor_total)                 AS receita_bruta,
         sum(valor_liquido)               AS receita_liquida,
         sum(valor_total - valor_liquido) AS taxa_plataforma
  FROM public.fato_pedidos
  GROUP BY 1
)
SELECT
  e.evento_id,
  e.nome_evento,
  e.data_inicio,
  e.cidade,
  coalesce(pa.ingressos, 0)     AS ingressos,
  coalesce(pa.compareceram, 0)  AS compareceram,
  round(100.0 * pa.compareceram / nullif(pa.ingressos, 0), 1) AS taxa_comparecimento,
  pd.receita_bruta,
  pd.receita_liquida,
  pd.taxa_plataforma
FROM public.dim_eventos e
LEFT JOIN participantes pa ON pa.evento_id = e.evento_id
LEFT JOIN pedidos       pd ON pd.evento_id = e.evento_id;

-- Diretoria: curso e evento aparecem em linhas separadas, nunca somados.
-- Ingresso de R$ 19,90 e matrícula de R$ 1.900 não são a mesma unidade.
DROP VIEW IF EXISTS public.vw_diretoria_consolidado CASCADE;
CREATE VIEW public.vw_diretoria_consolidado AS
SELECT
  date_trunc('month', p.data_pagamento)::date AS mes,
  'cursos'::text                              AS unidade_negocio,
  sum(p.valor)                                AS receita_liquida,
  count(*)                                    AS transacoes
FROM public.fato_pagamento_base p
GROUP BY 1

UNION ALL

SELECT
  date_trunc('month', e.data_pedido)::date,
  'eventos',
  sum(e.valor_liquido),
  count(*)
FROM public.fato_pedidos e
GROUP BY 1;


-- ============================================================
-- vw_financeiro_receita
--
-- Caso especial: é a única view usada pelo front que o export não conseguiu
-- trazer — o `count=exact` nela estourava o statement timeout do Supabase.
-- Sem snapshot não há gabarito, então a reconstrução vem do DDL da migration
-- 05 e a conferência possível foi outra: as colunas da spec do PostgREST
-- batem exatamente com as do DDL, e o total por unidade fecha com
-- vw_diretoria_consolidado, que essa sim foi validada contra o snapshot.
-- ============================================================
DROP VIEW IF EXISTS public.vw_financeiro_receita CASCADE;
CREATE VIEW public.vw_financeiro_receita AS
SELECT
  date_trunc('month', p.data_pagamento)::date            AS mes,
  coalesce(p.unidade_geradora_venda, 'nao_informado')    AS unidade,
  'curso'::text                                          AS tipo_receita,
  p.status_pagamento,
  p.forma_pagamento,
  count(*)                                               AS transacoes,
  sum(p.valor)                                           AS valor_bruto,
  sum(p.valor)                                           AS valor_liquido
FROM public.fato_pagamento_base p
GROUP BY 1, 2, 3, 4, 5

UNION ALL

SELECT
  date_trunc('month', e.data_pedido)::date,
  'eventos',
  'evento',
  e.status_pedido,
  e.forma_pagamento,
  count(*),
  sum(e.valor_total),
  sum(e.valor_liquido)   -- o Sympla retém ~11,5%; o caixa recebe o líquido
FROM public.fato_pedidos e
GROUP BY 1, 2, 3, 4, 5;
