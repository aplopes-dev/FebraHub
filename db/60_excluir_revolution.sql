-- ============================================================
-- FebraHub · Migration 60 — REVOLUTION e Holding fora do faturamento
--
-- PROBLEMA: REVOLUTION (CIS Revolution) e METODO CIS GLOBAL HOLDING são
-- 100% repasse — nada fica para a unidade Salvador. Hoje eles têm
-- pct_unidade = 0, então o LÍQUIDO é zero, mas continuam aparecendo no
-- BRUTO (R$ 87 mil do REVOLUTION em 2026, na categoria Evento). Isso
-- infla o faturamento bruto e faz surgir um "repasse" indevido no
-- Hub Financeiro.
--
-- CORREÇÃO: como nada fica para a unidade, eles saem por completo —
-- filtro no final da view remove as vendas desses cursos. Assim não
-- aparecem nem no bruto nem no líquido.
--
-- Toda a lógica de split (CIS Global por faixa de data, mentorias TCB/TCL,
-- Coaching Individual) foi preservada exatamente como estava.
-- ============================================================

-- create or replace preserva as 20 views dependentes: como as colunas
-- e a ordem delas não mudam, o Postgres aceita a substituição sem cascade.
create or replace view public.vw_venda_faturamento as
 WITH venda_valor AS (
         SELECT p.original_id_venda,
            max(p.consultor_id) AS consultor_id,
            max(p.data_pagamento) AS data_pagamento,
            max(p.valor) AS valor,
            max(p.tipo_matricula) AS tipo_matricula,
            max(p.nome_venda) AS nome_venda
           FROM fato_pagamento_base p
          WHERE ((p.tipo_matricula = ANY (ARRAY['Matrícula'::text, 'COMPRADOR DE VAGAS'::text, 'MAT. RETROATIVA'::text])) AND (p.valor IS NOT NULL) AND (p.data_pagamento IS NOT NULL))
          GROUP BY p.original_id_venda
        ), matricula_da_venda AS (
         SELECT DISTINCT ON (fato_base_alunos.original_id_venda) fato_base_alunos.original_id_venda,
            fato_base_alunos.curso_id
           FROM fato_base_alunos
          WHERE (fato_base_alunos.curso_id IS NOT NULL)
          ORDER BY fato_base_alunos.original_id_venda, fato_base_alunos.valor DESC NULLS LAST
        ), base AS (
         SELECT vv.original_id_venda,
            vv.consultor_id,
            vv.data_pagamento,
            vv.tipo_matricula,
            vv.nome_venda,
            cur.curso_id,
            cur.tipo AS tipo_curso,
            cur.nome_curso,
            cur.nome_curto,
            vv.valor AS valor_bruto
           FROM ((venda_valor vv
             LEFT JOIN matricula_da_venda m ON ((m.original_id_venda = vv.original_id_venda)))
             LEFT JOIN dim_cursos cur ON ((cur.curso_id = m.curso_id)))
          -- EXCLUSÃO: cursos 100% repasse não entram no faturamento da unidade
          WHERE (cur.curso_id IS NULL OR cur.curso_id <> ALL (ARRAY['REVOLUTION'::text, 'METODO CIS GLOBAL HOLDING'::text]))
        )
 SELECT original_id_venda,
    consultor_id,
    data_pagamento,
    tipo_matricula,
    COALESCE(tipo_curso,
        CASE
            WHEN (split_part(nome_venda, ' - '::text, 2) ~~ 'PMC%'::text) THEN 'Evento'::text
            ELSE NULL::text
        END, 'Sem categoria'::text) AS categoria_curso,
    COALESCE(nome_curso,
        CASE
            WHEN (split_part(nome_venda, ' - '::text, 2) ~~ 'PMC%'::text) THEN 'Programa Multiplicador de Crescimento'::text
            ELSE NULL::text
        END, 'Sem vínculo'::text) AS curso,
    COALESCE(nome_curto, nome_curso,
        CASE
            WHEN (split_part(nome_venda, ' - '::text, 2) ~~ 'PMC%'::text) THEN 'PMC'::text
            ELSE NULL::text
        END, 'Sem vínculo'::text) AS curso_curto,
        CASE
            WHEN (curso_id = ANY (ARRAY['METODO CIS GLOBAL'::text, 'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL'::text, 'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL'::text, 'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL'::text])) THEN
            CASE
                WHEN (data_pagamento < '2023-01-01'::date) THEN 0.20
                WHEN (data_pagamento < '2026-06-01'::date) THEN 0.50
                ELSE 0.80
            END
            WHEN (curso_id = ANY (ARRAY['TEAM COACHING BUSINESS'::text, 'TEAM COACHING LIFE'::text])) THEN 0.50
            WHEN (tipo_curso = 'Coaching Individual'::text) THEN 0.50
            ELSE 1.0
        END AS pct_unidade,
    valor_bruto,
    (valor_bruto *
        CASE
            WHEN (curso_id = ANY (ARRAY['METODO CIS GLOBAL'::text, 'METODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL'::text, 'MÉTODO CIS GLOBAL - INTELIGÊNCIA EMOCIONAL'::text, 'MÉTODO CIS GLOBAL- INTELIGÊNCIA EMOCIONAL'::text])) THEN
            CASE
                WHEN (data_pagamento < '2023-01-01'::date) THEN 0.20
                WHEN (data_pagamento < '2026-06-01'::date) THEN 0.50
                ELSE 0.80
            END
            WHEN (curso_id = ANY (ARRAY['TEAM COACHING BUSINESS'::text, 'TEAM COACHING LIFE'::text])) THEN 0.50
            WHEN (tipo_curso = 'Coaching Individual'::text) THEN 0.50
            ELSE 1.0
        END) AS valor
   FROM base b;

grant select on public.vw_venda_faturamento to authenticated;

notify pgrst, 'reload schema';
