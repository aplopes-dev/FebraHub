-- ============================================================
-- FebraHub · Migration 63 — data_aprovacao nas views comerciais
--
-- Propaga data_aprovacao (criada na migration 62 na vw_venda_faturamento)
-- para as views comerciais que o front usa em filtros de período recente.
--
-- RODAR A 62 ANTES desta — a 63 depende da coluna que a 62 cria.
--
-- Cadeia de dependência descoberta:
--   vw_venda_faturamento (tem data_aprovacao via mig 62)
--     -> vw_comercial_geral_mensal        [recriada aqui]
--     -> vw_comercial_cursos_por_consultora [recriada aqui]
--     -> vw_comercial_ranking_historico   [recriada aqui]
--     -> vw_comercial_ranking_geral_consolidado [recriada aqui]
--     -> vw_comercial_carinhas            [PRECISA expor — ver nota]
--          -> vw_comercial_carinhas_ggb   [recriada aqui]
--          -> vw_comercial_verdes_detalhe [recriada aqui]
--
-- NOTA: carinhas_ggb e verdes_detalhe leem de vw_comercial_carinhas.
-- Se essa view não expõe data_aprovacao, elas não recebem. Preciso da
-- definição de vw_comercial_carinhas para completar — por ora, as duas
-- que dependem dela ficam com coalesce no data_pagamento (sem regressão).
-- ============================================================

-- 1) geral_mensal
create or replace view public.vw_comercial_geral_mensal as
 SELECT (date_trunc('month'::text, (data_pagamento)::timestamp with time zone))::date AS mes,
    data_pagamento AS data,
    valor_bruto,
    valor,
        CASE WHEN (tipo_matricula = 'COMPRADOR DE VAGAS'::text) THEN 0 ELSE 1 END AS conta_matricula,
    data_aprovacao
   FROM vw_venda_faturamento f
  WHERE pode_ver('comercial'::text);
grant select on public.vw_comercial_geral_mensal to authenticated;

-- 2) cursos_por_consultora
create or replace view public.vw_comercial_cursos_por_consultora as
 SELECT
        CASE f.categoria_curso WHEN 'Coaching Individual'::text THEN 'CI'::text ELSE f.categoria_curso END AS categoria,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN 'Danilo'::text
             ELSE COALESCE(cons.nome, f.consultor_id) END AS consultora,
    f.curso,
    f.curso_curto,
    f.data_pagamento AS data,
    f.valor_bruto,
    f.valor,
    f.data_aprovacao
   FROM (vw_venda_faturamento f
     LEFT JOIN dim_consultores cons ON ((cons.consultor_id = f.consultor_id)))
  WHERE pode_ver('comercial'::text);
grant select on public.vw_comercial_cursos_por_consultora to authenticated;

-- 3) ranking_geral_consolidado
create or replace view public.vw_comercial_ranking_geral_consolidado as
 SELECT f.data_pagamento AS data,
    f.valor_bruto,
    f.valor,
        CASE WHEN (f.tipo_matricula = 'COMPRADOR DE VAGAS'::text) THEN 0 ELSE 1 END AS conta_matricula,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN 'Danilo'::text
             ELSE COALESCE(cons.nome, f.consultor_id) END AS consultora,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN NULL::text
             WHEN cons.ativa THEN cons.foto_url ELSE NULL::text END AS foto_url,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN false
             WHEN cons.ativa THEN true ELSE false END AS atual,
    f.data_aprovacao
   FROM (vw_venda_faturamento f
     LEFT JOIN dim_consultores cons ON ((cons.consultor_id = f.consultor_id)))
  WHERE pode_ver('comercial'::text);
grant select on public.vw_comercial_ranking_geral_consolidado to authenticated;

-- 4) ranking_historico
create or replace view public.vw_comercial_ranking_historico as
 SELECT
        CASE f.categoria_curso WHEN 'Coaching Individual'::text THEN 'CI'::text ELSE f.categoria_curso END AS categoria,
    f.data_pagamento AS data,
    f.valor_bruto,
    f.valor,
        CASE WHEN (f.tipo_matricula = 'COMPRADOR DE VAGAS'::text) THEN 0 ELSE 1 END AS conta_matricula,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN 'Danilo'::text
             ELSE f.consultor_id END AS consultor_id_exibicao,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN 'Danilo'::text
             ELSE COALESCE(cons.nome, f.consultor_id) END AS consultora,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN NULL::text
             WHEN cons.ativa THEN cons.foto_url ELSE NULL::text END AS foto_url,
        CASE WHEN ((f.consultor_id = 'Marlany Santos de Bona Fernandes'::text) AND (f.data_pagamento < '2025-05-07'::date)) THEN false
             WHEN cons.ativa THEN true ELSE false END AS atual,
    f.data_aprovacao
   FROM (vw_venda_faturamento f
     LEFT JOIN dim_consultores cons ON ((cons.consultor_id = f.consultor_id)))
  WHERE pode_ver('comercial'::text);
grant select on public.vw_comercial_ranking_historico to authenticated;

-- 5) carinhas (agrega de fato_pagamento_base — adiciona data_aprovacao)
create or replace view public.vw_comercial_carinhas as
 WITH venda_formas AS (
         SELECT p.original_id_venda,
            max(p.consultor_id) AS consultor_id,
            max(p.data_pagamento) AS data_pagamento,
            max(p.data_aprovacao) AS data_aprovacao,
            sum(p.valor) AS valor,
            bool_or((t.tipo = 'bom'::text)) AS tem_bom,
            bool_or((t.tipo = 'cartao'::text)) AS tem_cartao,
            bool_and(
                CASE WHEN (t.tipo = 'cartao'::text) THEN t.eh_stone ELSE NULL::boolean END) AS cartao_so_stone
           FROM (fato_pagamento_base p
             JOIN vw_comercial_forma_tipo t ON ((t.forma_pagamento = p.forma_pagamento)))
          WHERE ((p.original_id_venda IS NOT NULL) AND (p.tipo_matricula = 'Matrícula'::text))
          GROUP BY p.original_id_venda
        )
 SELECT vf.original_id_venda,
    vf.consultor_id,
    cons.nome AS consultora,
    vf.data_pagamento,
    vf.valor,
        CASE
            WHEN (vf.tem_bom AND (NOT vf.tem_cartao)) THEN 'verde'::text
            WHEN (vf.tem_cartao AND (NOT vf.tem_bom) AND vf.cartao_so_stone) THEN 'vermelho'::text
            WHEN (vf.tem_bom OR vf.tem_cartao) THEN 'amarelo'::text
            ELSE NULL::text
        END AS carinha,
    COALESCE(vf.data_aprovacao, vf.data_pagamento) AS data_aprovacao
   FROM (venda_formas vf
     JOIN dim_consultores cons ON ((cons.consultor_id = vf.consultor_id)))
  WHERE pode_ver('comercial'::text);
grant select on public.vw_comercial_carinhas to authenticated;

-- 6) carinhas_ggb (herda data_aprovacao de carinhas)
create or replace view public.vw_comercial_carinhas_ggb as
 SELECT c.consultor_id,
    c.consultora,
    cons.foto_url,
    c.data_pagamento,
    c.valor,
    c.carinha,
    c.data_aprovacao
   FROM (vw_comercial_carinhas c
     JOIN dim_consultores cons ON ((cons.consultor_id = c.consultor_id)))
  WHERE ((c.carinha IS NOT NULL) AND (c.data_pagamento >= '2025-01-01'::date) AND (c.consultor_id = ANY (ARRAY['Alana Faleiro Coutinho'::text, 'Beatriz Souza'::text, 'Beatriz Martins de Novaes'::text])));
grant select on public.vw_comercial_carinhas_ggb to authenticated;

-- 7) verdes_detalhe (herda data_aprovacao de carinhas)
create or replace view public.vw_comercial_verdes_detalhe as
 SELECT c.data_pagamento AS data,
    c.consultora,
    cons.foto_url,
    NULLIF(split_part(p.nome_venda, ' - '::text, 3), ''::text) AS cliente,
    split_part(p.nome_venda, ' - '::text, 2) AS codigo_turma,
    COALESCE(f.curso_curto, f.curso) AS curso,
    f.categoria_curso AS categoria,
    round(c.valor) AS valor,
    p.formas,
    p.n_formas,
    c.original_id_venda,
    (('https://febracis.lightning.force.com/lightning/r/Opportunity/'::text || c.original_id_venda) || '/view'::text) AS link_salesforce,
    c.data_aprovacao
   FROM (((vw_comercial_carinhas c
     JOIN dim_consultores cons ON ((cons.consultor_id = c.consultor_id)))
     LEFT JOIN vw_venda_faturamento f ON ((f.original_id_venda = c.original_id_venda)))
     LEFT JOIN LATERAL ( SELECT string_agg(DISTINCT fato_pagamento_base.forma_pagamento, ' + '::text ORDER BY fato_pagamento_base.forma_pagamento) AS formas,
            count(DISTINCT fato_pagamento_base.forma_pagamento) AS n_formas,
            max(fato_pagamento_base.nome_venda) AS nome_venda
           FROM fato_pagamento_base
          WHERE (fato_pagamento_base.original_id_venda = c.original_id_venda)) p ON (true))
  WHERE ((c.carinha = 'verde'::text) AND (c.data_pagamento >= '2025-01-01'::date) AND (c.consultor_id = ANY (ARRAY['Alana Faleiro Coutinho'::text, 'Beatriz Souza'::text, 'Beatriz Martins de Novaes'::text])));
grant select on public.vw_comercial_verdes_detalhe to authenticated;

notify pgrst, 'reload schema';
