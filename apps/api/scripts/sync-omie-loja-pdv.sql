-- =============================================================================
-- sync-omie-loja-pdv.sql
-- Sincroniza produtos do Omie (fato_loja_estoque) → PDV da Loja
--
-- Regra do negócio:
--   Todo produto com saldo > 0 no Omie é "ESTOQUE LOJA" e deve ficar
--   disponível para venda no PDV (vende_pdv=true, exibe_cardapio=true).
--   Todo produto com saldo = 0 no Omie fica vende_pdv=false.
--
-- Estratégia:
--   - Produtos são identificados por produto_estoque_id = fato_loja_estoque.produto_id
--   - Se o produto já existe (pelo produto_estoque_id): atualiza
--   - Se não existe: insere novo
--   - Saldo no local LOJA é sincronizado com o saldo do Omie
--
-- Idempotente: pode ser reexecutado a qualquer momento.
-- =============================================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 0: garantir categorias base (idempotente pelo nome único)
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO loja_categorias (nome, descricao, cor, ativo, ordem)
VALUES
  ('Livros',         'Livros e publicações',           '#6366f1', true, 10),
  ('Apostilas',      'Apostilas e materiais didáticos','#f59e0b', true, 20),
  ('Camisas',        'Camisas e vestuário',            '#10b981', true, 30),
  ('Bolsas',         'Bolsas e mochilas',              '#ec4899', true, 40),
  ('Acessórios',     'Acessórios e joias',             '#8b5cf6', true, 50),
  ('Kits',           'Kits e combos',                  '#f97316', true, 60),
  ('Alimentos',      'Alimentos e lanches',            '#84cc16', true, 70),
  ('Bebidas',        'Cafés, chás e bebidas',          '#0ea5e9', true, 80),
  ('Outros',         'Outros produtos',                '#6b7280', true, 99)
ON CONFLICT (lower(nome)) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 1: tabela temporária com dados Omie normalizados + categoria inferida
-- A categoria usa palavras exatas com word-boundaries (regex) para evitar
-- falsos positivos (ex: "CHARA" ≠ "CHÁ", "MOCHILA" é bolsa, não camisa).
-- ──────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS _tmp_omie_sync;

CREATE TEMP TABLE _tmp_omie_sync AS
SELECT
  fe.produto_id                                           AS omie_id,
  TRIM(fe.descricao)                                      AS nome,
  NULLIF(TRIM(COALESCE(fe.codigo_interno, fe.codigo)), '') AS sku,
  ROUND(COALESCE(fe.preco_unitario, 0)::numeric, 2)       AS preco,
  ROUND(COALESCE(fe.custo_medio, 0)::numeric, 2)          AS custo,
  GREATEST(COALESCE(fe.saldo, 0)::numeric, 0)             AS saldo_fisico,
  (COALESCE(fe.saldo, 0) > 0)                             AS tem_estoque,
  -- ──────────────────────────────────────────────────────────────────────────
  -- Inferência de categoria por palavras-chave do nome do produto
  -- Ordem importa: mais específico primeiro
  -- ──────────────────────────────────────────────────────────────────────────
  CASE
    -- BOLSAS / MOCHILAS
    WHEN TRIM(fe.descricao) ~* '\mbolsa\M'
      OR TRIM(fe.descricao) ~* '\mmochila\M'              THEN 'Bolsas'

    -- ROUPAS / VESTUÁRIO
    WHEN TRIM(fe.descricao) ~* '\mcamisa\M'
      OR TRIM(fe.descricao) ~* '\mcamiseta\M'
      OR TRIM(fe.descricao) ~* '\mbone\M'
      OR TRIM(fe.descricao) ~* '\mboné\M'
      OR TRIM(fe.descricao) ~* '\mcolar\M'
      OR TRIM(fe.descricao) ~* '\mpulseira\M'
      OR TRIM(fe.descricao) ~* '\mbracelete\M'
      OR TRIM(fe.descricao) ~* '\mrelogio\M'
      OR TRIM(fe.descricao) ~* '\mrelógio\M'
      OR TRIM(fe.descricao) ~* '\mtouca\M'
      OR TRIM(fe.descricao) ~* '\mmeia\M'
      OR TRIM(fe.descricao) ~* '\mpolo\M'                 THEN 'Camisas'

    -- BEBIDAS: palavras completas (evita "CHARA", "MOCHA")
    WHEN TRIM(fe.descricao) ~* '\mcafe\M'
      OR TRIM(fe.descricao) ~* '\mcafé\M'
      OR TRIM(fe.descricao) ~* '\mchá\M'
      OR TRIM(fe.descricao) ~* '^CHÁ$'
      OR TRIM(fe.descricao) ~* '^CAFÉ$'
      OR TRIM(fe.descricao) ~* '^ÁGUA$'
      OR TRIM(fe.descricao) ~* '^ÁGUA COM GÁS$'
      OR TRIM(fe.descricao) ~* '\mcapsula\M'
      OR TRIM(fe.descricao) ~* '\mcápsula\M'
      OR TRIM(fe.descricao) ~* '\madocante\M'
      OR TRIM(fe.descricao) ~* '\madoçante\M'
      OR TRIM(fe.descricao) ~* '\macucar\M'
      OR TRIM(fe.descricao) ~* '\maçúcar\M'
      OR TRIM(fe.descricao) ~* '\magua\M'
      OR TRIM(fe.descricao) ~* '\mágua\M'
      OR TRIM(fe.descricao) ~* '\msuco\M'
      OR TRIM(fe.descricao) ~* '\mbebida\M'
      OR TRIM(fe.descricao) ~* 'cappuccino'
      OR TRIM(fe.descricao) ~* '3coracoes'
      OR TRIM(fe.descricao) ~* '3corações'                THEN 'Bebidas'

    -- ALIMENTOS (sachês, etc. — DEPOIS de bebidas)
    WHEN TRIM(fe.descricao) ~* '\msache\M'
      OR TRIM(fe.descricao) ~* '\msachê\M'
      OR TRIM(fe.descricao) ~* '\malimento\M'
      OR TRIM(fe.descricao) ~* '\mlanche\M'               THEN 'Alimentos'

    -- KITS / BOXES
    WHEN TRIM(fe.descricao) ~* '\mbox\M'
      OR TRIM(fe.descricao) ~* '\mkit\M'
      OR TRIM(fe.descricao) ~* '\mcaixa\M'
      OR TRIM(fe.descricao) ~* '\mcombo\M'                THEN 'Kits'

    -- APOSTILAS / CADERNOS (antes de livros)
    WHEN TRIM(fe.descricao) ~* '\mapostila\M'
      OR TRIM(fe.descricao) ~* '\mcaderno\M'
      OR TRIM(fe.descricao) ~* '\mworkbook\M'             THEN 'Apostilas'

    -- LIVROS: "LIVRO" no início, publishers conhecidos, keywords
    WHEN TRIM(fe.descricao) ILIKE 'LIVRO%'
      OR TRIM(fe.descricao) ~* '\mcards\M'
      OR TRIM(fe.descricao) ~* '\mplanner\M'
      OR TRIM(fe.descricao) ~* '\mbíblia\M'
      OR TRIM(fe.descricao) ~* '\mbiblia\M'
      OR TRIM(fe.descricao) ~* '\magenda\M'
      OR TRIM(fe.descricao) ~* '\mhabitos\M'
      OR TRIM(fe.descricao) ~* '\mhábitos\M'
      OR TRIM(fe.descricao) ~* '\mprincipios\M'
      OR TRIM(fe.descricao) ~* '\mprincípios\M'
      -- publishers: padrão " - EDITORA" no final
      OR TRIM(fe.descricao) ~* '- ACADEMIA$'
      OR TRIM(fe.descricao) ~* '- SEXTANTE$'
      OR TRIM(fe.descricao) ~* '- RECORD$'
      OR TRIM(fe.descricao) ~* '- RECORDS$'
      OR TRIM(fe.descricao) ~* '- VIDA$'
      OR TRIM(fe.descricao) ~* '- M BOOKS$'
      OR TRIM(fe.descricao) ~* '- MUNDO CRISTAO$'
      OR TRIM(fe.descricao) ~* '- NOVA ERA$'
      OR TRIM(fe.descricao) ~* '- HARPERCOLLINS$'
      OR TRIM(fe.descricao) ~* '- BEST SELLER$'
      OR TRIM(fe.descricao) ~* '- SARAIVA$'
      OR TRIM(fe.descricao) ~* '- ALTA BOOKS$'
      OR TRIM(fe.descricao) ~* '- UNIVERSO DOS LIVROS$'
      OR TRIM(fe.descricao) ~* '- MARFONTES$'
      OR TRIM(fe.descricao) ~* '- CHARA$'
      OR TRIM(fe.descricao) ~* '- CHARÁ$'
      OR TRIM(fe.descricao) ~* '- THOMAS NELSON$'
      OR TRIM(fe.descricao) ~* '- CDL$'
      OR TRIM(fe.descricao) ~* '- ATLAS$'
      OR TRIM(fe.descricao) ~* '- GENTE$'
      OR TRIM(fe.descricao) ~* '- PENSAMENTO$'
      OR TRIM(fe.descricao) ~* '- PORTICO$'               THEN 'Livros'

    ELSE 'Outros'
  END AS categoria_nome
FROM fato_loja_estoque fe
WHERE fe.descricao IS NOT NULL
  AND TRIM(fe.descricao) <> '';

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 2: UPDATE — produtos que já existem no catálogo (produto_estoque_id match)
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE loja_produtos lp
SET
  nome            = t.nome,
  preco           = t.preco,
  custo           = NULLIF(t.custo, 0),
  vende_pdv       = t.tem_estoque,
  exibe_cardapio  = t.tem_estoque,
  ativo           = true,
  categoria_id    = COALESCE(cats.id, lp.categoria_id),
  atualizado_em   = NOW()
FROM _tmp_omie_sync t
LEFT JOIN loja_categorias cats ON lower(cats.nome) = lower(t.categoria_nome)
WHERE lp.produto_estoque_id = t.omie_id;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 3: INSERT — produtos novos (sem produto_estoque_id correspondente)
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO loja_produtos (
  nome,
  sku,
  descricao,
  preco,
  custo,
  unidade,
  produto_estoque_id,
  ativo,
  vende_pdv,
  exibe_cardapio,
  precisa_preparacao,
  controla_estoque,
  estoque_minimo,
  ordem,
  categoria_id,
  criado_em,
  atualizado_em
)
SELECT
  t.nome,
  NULL       AS sku,
  ''         AS descricao,
  t.preco,
  NULLIF(t.custo, 0),
  'un',
  t.omie_id  AS produto_estoque_id,
  true,
  t.tem_estoque,
  t.tem_estoque,
  false,
  true,
  0,
  0,
  cats.id,
  NOW(),
  NOW()
FROM _tmp_omie_sync t
LEFT JOIN loja_categorias cats ON lower(cats.nome) = lower(t.categoria_nome)
WHERE NOT EXISTS (
  SELECT 1 FROM loja_produtos lp WHERE lp.produto_estoque_id = t.omie_id
);

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 4: UPSERT loja_estoque_saldos — local LOJA com saldo do Omie
-- ──────────────────────────────────────────────────────────────────────────────
INSERT INTO loja_estoque_saldos (produto_id, local, saldo_fisico, reservado)
SELECT
  lp.id          AS produto_id,
  'LOJA'         AS local,
  t.saldo_fisico AS saldo_fisico,
  0              AS reservado
FROM _tmp_omie_sync t
JOIN loja_produtos lp ON lp.produto_estoque_id = t.omie_id
ON CONFLICT (produto_id, local) DO UPDATE
  SET
    saldo_fisico = GREATEST(
      EXCLUDED.saldo_fisico,
      loja_estoque_saldos.reservado  -- nunca cai abaixo do reservado
    ),
    atualizado_em = NOW();

-- Garante linha DEPOSITO (saldo zero) para não quebrar UX de estoque
INSERT INTO loja_estoque_saldos (produto_id, local, saldo_fisico, reservado)
SELECT
  lp.id  AS produto_id,
  'DEPOSITO',
  0,
  0
FROM _tmp_omie_sync t
JOIN loja_produtos lp ON lp.produto_estoque_id = t.omie_id
ON CONFLICT (produto_id, local) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- STEP 5: produtos Omie zerados → vende_pdv=false (não aparecem no PDV)
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE loja_produtos lp
SET
  vende_pdv      = false,
  exibe_cardapio = false,
  atualizado_em  = NOW()
FROM _tmp_omie_sync t
WHERE lp.produto_estoque_id = t.omie_id
  AND t.tem_estoque = false;

-- ──────────────────────────────────────────────────────────────────────────────
-- RELATÓRIO FINAL
-- ──────────────────────────────────────────────────────────────────────────────
SELECT
  'Omie: total de produtos'                          AS metrica,
  COUNT(*)::text                                     AS valor
FROM fato_loja_estoque
UNION ALL
SELECT 'Omie: produtos com saldo > 0', COUNT(*)::text
FROM fato_loja_estoque WHERE COALESCE(saldo, 0) > 0
UNION ALL
SELECT 'Loja: total de produtos cadastrados', COUNT(*)::text
FROM loja_produtos
UNION ALL
SELECT 'PDV: produtos disponíveis (vende_pdv=true, ativo)', COUNT(*)::text
FROM loja_produtos WHERE vende_pdv = true AND ativo = true
UNION ALL
SELECT 'Estoque LOJA: linhas com saldo > 0', COUNT(*)::text
FROM loja_estoque_saldos WHERE local = 'LOJA' AND saldo_fisico > 0
UNION ALL
SELECT 'Categorias ativas', COUNT(*)::text
FROM loja_categorias WHERE ativo = true;

DROP TABLE IF EXISTS _tmp_omie_sync;

COMMIT;
