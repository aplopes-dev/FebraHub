-- ============================================================================
-- Índices únicos que sustentam o ON CONFLICT dos ETLs
--
-- POR QUE FALTAVAM: o export do Supabase saiu pelo PostgREST, que devolve
-- DADOS, não DDL. As tabelas foram recriadas a partir da spec (colunas e
-- tipos) e por isso nasceram só com a chave primária. Os índices ÚNICOS
-- SECUNDÁRIOS — os que não são PK mas sustentam um `ON CONFLICT (a, b)` —
-- ficaram para trás, e o Postgres recusa o upsert com 42P10:
--   "there is no unique or exclusion constraint matching the ON CONFLICT"
--
-- É a mesma família do que aconteceu com as sequences de fato_avaliacao e
-- fato_retencao: tudo que era DDL e não dado precisou ser reposto à mão.
--
-- Conferido antes de criar: zero grupos duplicados e zero NULL nas colunas de
-- chave nas duas tabelas (300 e 229 linhas). NULL importaria porque NULL nunca
-- é igual a NULL — uma linha com chave nula nunca casaria no ON CONFLICT e o
-- ETL duplicaria o registro a cada carga.
-- ============================================================================

-- Planilha de faturamento por curso (sheets_sync.py).
-- turma e treinador têm DEFAULT '' de propósito no ETL, justamente para nunca
-- serem NULL e poderem participar do conflict target.
CREATE UNIQUE INDEX IF NOT EXISTS ux_fato_loja_curso_chave
    ON public.fato_loja_curso (mes_ref, curso, turma, treinador);

-- Receitas extras da loja (sheets_extras_sync.py). `chave_origem` é um md5 das
-- partes discriminantes da linha da planilha — é o que dá identidade a um
-- lançamento que a origem não numera.
CREATE UNIQUE INDEX IF NOT EXISTS ux_fato_loja_receita_extra_chave
    ON public.fato_loja_receita_extra (fonte, chave_origem);
