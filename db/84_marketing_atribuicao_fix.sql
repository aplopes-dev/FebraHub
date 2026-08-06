-- ============================================================
-- FebraHub · Migration 84 — Corrige atribuição de marketing
--
-- PROBLEMA: a vw_marketing_atribuicao casa lead x aluno por email_cliente
-- e telefone_cliente da fato_base_alunos. Após a recarga do Salesforce,
-- esses campos ficaram quase vazios (673 email, 671 telefone de ~20k).
-- Resultado: a atribuição zerou.
--
-- SOLUÇÃO: buscar email/telefone da dim_alunos (que tem 11.879 email,
-- 10.684 telefone), ligada por CPF/aluno_id. A dim_alunos é a fonte de
-- contato confiável (mesma usada no painel de maestros).
--
-- Casa por aluno_id, com lpad no CPF para resolver zeros à esquerda
-- (mesmo cuidado dos maestros). email e telefone normalizados.
-- ============================================================

drop view if exists public.vw_marketing_atribuicao cascade;
create view public.vw_marketing_atribuicao as
 WITH aluno_contato AS (
   -- junta a venda (fato_base_alunos) com o contato real (dim_alunos)
   SELECT
     m.original_id_venda,
     m.data_fechamento_venda,
     m.aluno_id,
     m.telefone_cliente,
     -- email: usa o da fato se houver, senão o da dim_alunos
     lower(trim(coalesce(nullif(m.email_cliente, ''), da.email))) AS email_efetivo,
     -- telefone: idem
     regexp_replace(coalesce(nullif(m.telefone_cliente, ''), da.telefone), '\D', '', 'g') AS telefone_efetivo
   FROM fato_base_alunos m
   LEFT JOIN dim_alunos da
     ON lpad(regexp_replace(da.cpf, '\D', '', 'g'), 11, '0')
      = lpad(regexp_replace(m.aluno_id, '\D', '', 'g'), 11, '0')
   WHERE m.data_fechamento_venda IS NOT NULL
 ), matches AS (
   -- casa por EMAIL
   SELECT ac.original_id_venda, ac.data_fechamento_venda,
          l.nome_campanha, l.id_anuncio, l.data_criacao AS data_lead
   FROM aluno_contato ac
   JOIN fato_negocio_lead l
     ON l.email_contato IS NOT NULL
    AND trim(l.email_contato) <> ''
    AND lower(trim(l.email_contato)) = ac.email_efetivo
   WHERE ac.email_efetivo IS NOT NULL AND ac.email_efetivo <> ''
     AND l.data_criacao <= ac.data_fechamento_venda
   UNION
   -- casa por TELEFONE
   SELECT ac.original_id_venda, ac.data_fechamento_venda,
          l.nome_campanha, l.id_anuncio, l.data_criacao AS data_lead
   FROM aluno_contato ac
   JOIN dim_leads d
     ON length(regexp_replace(d.telefone_completo, '\D', '', 'g')) BETWEEN 10 AND 13
    AND regexp_replace(d.telefone_completo, '\D', '', 'g') = ac.telefone_efetivo
   JOIN fato_negocio_lead l ON l.lead_id = d.lead_id
   WHERE length(ac.telefone_efetivo) >= 10
     AND l.data_criacao <= ac.data_fechamento_venda
 ), ranked AS (
   SELECT matches.original_id_venda, matches.nome_campanha, matches.id_anuncio,
          matches.data_lead, matches.data_fechamento_venda,
          row_number() OVER (PARTITION BY matches.original_id_venda
                             ORDER BY matches.data_lead DESC) AS rn
   FROM matches
 )
 SELECT r.original_id_venda, r.nome_campanha, r.id_anuncio, r.data_lead,
    f.data_pagamento, f.categoria_curso, f.curso, f.valor_bruto,
        CASE
            WHEN ((r.nome_campanha ~~* '%networking%') OR (r.nome_campanha ~~* '%[ll]%')) THEN 'LL'
            WHEN (r.nome_campanha ~~* '%cis%') THEN 'CIS'
            WHEN ((r.nome_campanha ~~* '%bhp%') OR (r.nome_campanha ~~* '%ml5%') OR (r.nome_campanha ~~* '%fop%') OR (r.nome_campanha ~~* '%fgpc%') OR (r.nome_campanha ~~* '%[if]%') OR (r.nome_campanha ~~* '%vend%')) THEN 'GGB'
            WHEN ((r.nome_campanha ~~* '%[$]%') OR (r.nome_campanha ~~* '%[lp]%') OR (r.nome_campanha ~~* '%palestra%') OR (r.nome_campanha ~~* '%evento%')) THEN 'Eventos'
            WHEN (r.nome_campanha IS NULL) THEN 'Sem campanha'
            ELSE 'Outros'
        END AS categoria
   FROM ranked r
   JOIN vw_venda_faturamento f ON f.original_id_venda = r.original_id_venda
  WHERE r.rn = 1;
grant select on public.vw_marketing_atribuicao to authenticated;

notify pgrst, 'reload schema';

-- ============================================================
-- Recriar a vw_marketing_atribuicao_campanha (derrubada pelo cascade)
-- ============================================================
create or replace view public.vw_marketing_atribuicao_campanha as
 SELECT (date_trunc('month', (data_pagamento)::timestamp with time zone))::date AS mes,
    nome_campanha,
    categoria,
    count(*) AS vendas_atribuidas,
    round(sum(valor_bruto)) AS faturamento_atribuido
   FROM public.vw_marketing_atribuicao
  GROUP BY ((date_trunc('month', (data_pagamento)::timestamp with time zone))::date), nome_campanha, categoria;
grant select on public.vw_marketing_atribuicao_campanha to authenticated;

notify pgrst, 'reload schema';
