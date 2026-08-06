-- ============================================================
-- FebraHub · Migration 62 — data_aprovacao na vw_venda_faturamento
--
-- Os filtros "hoje" / "7 dias" do comercial precisam de data_aprovacao
-- (mostra o que ENTROU no período), mas a view central só expunha
-- data_pagamento. Sem a coluna, o front cai sempre no pagamento e as
-- vendas aprovadas recentemente não aparecem.
--
-- Adiciona data_aprovacao (com coalesce para data_pagamento onde a
-- aprovação é nula, para linhas antigas não sumirem).
--
-- create or replace SEM cascade: as 20 views dependentes continuam
-- intactas porque as colunas existentes não mudam de nome nem de ordem
-- — data_aprovacao entra ao final.
-- ============================================================

create or replace view public.vw_venda_faturamento as
 WITH venda_valor AS (
         SELECT p.original_id_venda,
            max(p.consultor_id) AS consultor_id,
            max(p.data_pagamento) AS data_pagamento,
            max(p.data_aprovacao) AS data_aprovacao,
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
            vv.data_aprovacao,
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
        END) AS valor,
    -- NOVO: aprovação com reserva no pagamento (para filtros de período recente)
    COALESCE(data_aprovacao, data_pagamento) AS data_aprovacao
   FROM base b;

grant select on public.vw_venda_faturamento to authenticated;

notify pgrst, 'reload schema';
