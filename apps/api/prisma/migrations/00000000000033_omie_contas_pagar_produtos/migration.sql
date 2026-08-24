-- ============================================================================
-- FebraHub · Migration 33 — Omie: Contas a Pagar, Cadastro de Produtos
-- e enriquecimento do Estoque.
--
-- CONTEXTO
--   A integração com o Omie já existia via ETL (etl/omie_sync.py), mas só
--   trazia VENDAS (cupons/itens/pagamentos) e a POSIÇÃO de estoque para a Loja
--   (fato_loja_*). Faltavam três blocos que o Omie já tem e que o projeto
--   (Compras, Estoque, Financeiro/ERP) precisa:
--
--     1. Contas a Pagar  → financas/contapagar/ListarContasPagar
--     2. Cadastro de Produtos → geral/produtos/ListarProdutos (catálogo rico:
--        NCM, unidade, família, marca, custo, preço, dimensões, flags fiscais)
--     3. Estoque (posição) → já existe fato_loja_estoque; aqui só acrescentamos
--        as colunas que faltavam da resposta do Omie (nCMC = custo médio,
--        codigo_local_estoque, pendente).
--
-- PADRÃO
--   Tabelas de CARGA (fato_*), no mesmo modelo das outras: chave vinda da
--   origem, colunas achatadas, sem RLS complexa. A escrita passa pela rota
--   /ingest (token de máquina), então cada tabela é registrada em
--   TABELAS_INGESTAO (ingest.service.ts). GRANT select para authenticated,
--   como as demais fato_loja_*.
--
-- IDEMPOTENTE: só cria o que não existe; roda de novo sem erro.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) CONTAS A PAGAR (títulos do Omie)
--    Origem: conta_pagar_cadastro[] de ListarContasPagar.
--    O ETL enriquece fornecedor/categoria pelo nome (resolve os códigos com
--    os cadastros auxiliares de clientes e categorias), mas guarda também os
--    códigos crus para reconciliação.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fato_omie_contas_pagar (
  lancamento_id        bigint PRIMARY KEY,          -- codigo_lancamento_omie
  codigo_integracao    text,                        -- codigo_lancamento_integracao
  fornecedor_id        bigint,                       -- codigo_cliente_fornecedor
  fornecedor           text,                        -- resolvido pelo ETL (nome)
  fornecedor_documento text,                        -- cnpj_cpf resolvido
  categoria_codigo     text,                        -- codigo_categoria
  categoria            text,                        -- descricao da categoria (ETL)
  numero_documento     text,                        -- numero_documento
  numero_doc_fiscal    text,                        -- numero_documento_fiscal
  tipo_documento       text,                        -- codigo_tipo_documento (BOL, TRA...)
  numero_parcela       text,                        -- numero_parcela (001/001)
  forma_pagamento      text,                        -- cnab.codigo_forma_pagamento
  conta_corrente_id    bigint,                       -- id_conta_corrente
  data_emissao         date,                        -- data_emissao
  data_entrada         date,                        -- data_entrada
  data_vencimento      date,                        -- data_vencimento
  data_previsao        date,                        -- data_previsao (prevista p/ pagar)
  data_pagamento       date,                        -- baixa (info.dAlt quando PAGO)
  status               text,                        -- normalizado (A vencer/Pago/Vencido)
  status_titulo        text,                        -- status_titulo cru do Omie
  valor                numeric(14,2),               -- valor_documento
  valor_pago           numeric(14,2),               -- valor efetivamente baixado
  observacao           text,                        -- observacao
  data_alteracao       date,                        -- info.dAlt
  atualizado_em        timestamptz DEFAULT now()
);
GRANT SELECT ON public.fato_omie_contas_pagar TO authenticated;
CREATE INDEX IF NOT EXISTS ix_omie_cp_vencimento ON public.fato_omie_contas_pagar (data_vencimento);
CREATE INDEX IF NOT EXISTS ix_omie_cp_pagamento  ON public.fato_omie_contas_pagar (data_pagamento);
CREATE INDEX IF NOT EXISTS ix_omie_cp_status     ON public.fato_omie_contas_pagar (status);
CREATE INDEX IF NOT EXISTS ix_omie_cp_fornecedor ON public.fato_omie_contas_pagar (fornecedor_id);
CREATE INDEX IF NOT EXISTS ix_omie_cp_categoria  ON public.fato_omie_contas_pagar (categoria_codigo);

-- ---------------------------------------------------------------------------
-- 2) CADASTRO DE PRODUTOS (catálogo do Omie)
--    Origem: produto_servico_cadastro[] de ListarProdutos.
--    É o cadastro-mestre: descrição, unidade, NCM, família, marca, preço e
--    custo. Serve de dimensão para o estoque e para as compras.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fato_omie_produto (
  produto_id        bigint PRIMARY KEY,             -- codigo_produto
  codigo            text,                           -- codigo (SKU interno)
  codigo_integracao text,                           -- codigo_produto_integracao
  descricao         text,                           -- descricao
  descricao_detalhada text,                         -- descr_detalhada
  unidade           text,                           -- unidade (UN, CX...)
  ncm               text,                           -- ncm
  ean               text,                           -- ean (código de barras)
  cest              text,                           -- cest
  familia_id        bigint,                          -- codigo_familia
  familia           text,                           -- descricao_familia
  marca             text,                           -- marca
  modelo            text,                           -- modelo
  tipo_item         text,                           -- tipoItem (00 mercadoria, 07 serviço...)
  valor_unitario    numeric(14,4),                  -- valor_unitario (preço de venda)
  quantidade_estoque numeric(14,3),                 -- quantidade_estoque (snapshot no cadastro)
  estoque_minimo    numeric(14,3),                  -- estoque_minimo
  peso_liquido      numeric(14,3),                  -- peso_liq
  peso_bruto        numeric(14,3),                  -- peso_bruto
  inativo           boolean DEFAULT false,          -- inativo = 'S'
  bloqueado         boolean DEFAULT false,          -- bloqueado = 'S'
  data_inclusao     date,                           -- info.dInc
  data_alteracao    date,                           -- info.dAlt
  atualizado_em     timestamptz DEFAULT now()
);
GRANT SELECT ON public.fato_omie_produto TO authenticated;
CREATE INDEX IF NOT EXISTS ix_omie_prod_codigo  ON public.fato_omie_produto (codigo);
CREATE INDEX IF NOT EXISTS ix_omie_prod_familia ON public.fato_omie_produto (familia_id);
CREATE INDEX IF NOT EXISTS ix_omie_prod_ativo   ON public.fato_omie_produto (inativo);

-- ---------------------------------------------------------------------------
-- 3) ESTOQUE — colunas que faltavam de ListarPosEstoque
--    fato_loja_estoque já existia; acrescentamos custo médio (nCMC),
--    o local do Omie e a quantidade pendente. ADD COLUMN IF NOT EXISTS é
--    idempotente.
-- ---------------------------------------------------------------------------
ALTER TABLE public.fato_loja_estoque
  ADD COLUMN IF NOT EXISTS custo_medio       numeric(14,4),  -- nCMC (custo médio contábil)
  ADD COLUMN IF NOT EXISTS local_estoque_id  bigint,          -- codigo_local_estoque
  ADD COLUMN IF NOT EXISTS pendente          numeric(14,3),   -- nPendente
  ADD COLUMN IF NOT EXISTS codigo_interno    text;            -- cCodInt

-- ---------------------------------------------------------------------------
-- VIEWS de leitura — Financeiro (contas a pagar) e Compras/Estoque
-- ---------------------------------------------------------------------------

-- A pagar por horizonte (o que ainda se deve, quando vence)
DROP VIEW IF EXISTS public.vw_omie_a_pagar_horizonte CASCADE;
CREATE VIEW public.vw_omie_a_pagar_horizonte AS
SELECT
  CASE
    WHEN data_vencimento <= current_date              THEN '0 · vencido'
    WHEN data_vencimento <= current_date + 30         THEN '1 · até 30 dias'
    WHEN data_vencimento <= current_date + 60         THEN '2 · 31 a 60 dias'
    WHEN data_vencimento <= current_date + 90         THEN '3 · 61 a 90 dias'
    ELSE '4 · além de 90 dias'
  END                        AS horizonte,
  count(*)                   AS titulos,
  sum(valor)                 AS a_pagar
FROM public.fato_omie_contas_pagar
WHERE data_pagamento IS NULL
GROUP BY 1 ORDER BY 1;
GRANT SELECT ON public.vw_omie_a_pagar_horizonte TO authenticated;

-- Despesa por categoria (para onde vai o dinheiro)
DROP VIEW IF EXISTS public.vw_omie_despesa_categoria CASCADE;
CREATE VIEW public.vw_omie_despesa_categoria AS
SELECT
  coalesce(categoria, categoria_codigo, 'Sem categoria') AS categoria,
  count(*)                                               AS titulos,
  sum(valor)                                             AS total,
  sum(valor) FILTER (WHERE data_pagamento IS NOT NULL)   AS pago,
  sum(valor) FILTER (WHERE data_pagamento IS NULL)       AS em_aberto
FROM public.fato_omie_contas_pagar
GROUP BY 1 ORDER BY 3 DESC;
GRANT SELECT ON public.vw_omie_despesa_categoria TO authenticated;

-- Despesa paga por mês
DROP VIEW IF EXISTS public.vw_omie_pago_mensal CASCADE;
CREATE VIEW public.vw_omie_pago_mensal AS
SELECT
  date_trunc('month', data_pagamento)::date AS mes,
  count(*)                                   AS titulos,
  sum(coalesce(valor_pago, valor))           AS pago
FROM public.fato_omie_contas_pagar
WHERE data_pagamento IS NOT NULL
GROUP BY 1 ORDER BY 1;
GRANT SELECT ON public.vw_omie_pago_mensal TO authenticated;

-- Catálogo x posição de estoque (dimensão + saldo + valor imobilizado)
DROP VIEW IF EXISTS public.vw_omie_estoque_produto CASCADE;
CREATE VIEW public.vw_omie_estoque_produto AS
SELECT
  p.produto_id,
  p.codigo,
  p.descricao,
  p.unidade,
  p.familia,
  p.marca,
  p.ncm,
  p.valor_unitario                                       AS preco_venda,
  e.custo_medio,
  coalesce(e.saldo, p.quantidade_estoque, 0)             AS saldo,
  e.fisico,
  e.reservado,
  coalesce(e.estoque_minimo, p.estoque_minimo, 0)        AS estoque_minimo,
  round(coalesce(e.saldo,0) * coalesce(e.custo_medio, 0), 2)  AS valor_custo,
  round(coalesce(e.saldo,0) * coalesce(p.valor_unitario,0), 2) AS valor_venda,
  (coalesce(e.estoque_minimo, p.estoque_minimo) IS NOT NULL
    AND coalesce(e.saldo,0) <= coalesce(e.estoque_minimo, p.estoque_minimo)) AS abaixo_minimo,
  p.inativo,
  e.data_posicao
FROM public.fato_omie_produto p
LEFT JOIN public.fato_loja_estoque e ON e.produto_id = p.produto_id
WHERE NOT coalesce(p.inativo, false)
ORDER BY p.descricao;
GRANT SELECT ON public.vw_omie_estoque_produto TO authenticated;
