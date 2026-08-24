-- ====================================================================
-- FebraHub · Migration 31 — LOJA: produto rico, categorias e estoque
-- operacional por LOCAL (LOJA / DEPÓSITO).
--
-- CONTEXTO (PRD FEBRACIS LOJA, PDV e Cardápio):
--   O PDV/Compras hoje leem `fato_loja_estoque`, alimentada por ETL do
--   Omie — que pode SOBRESCREVER qualquer saldo baixado durante o evento.
--   Para a operação do grande evento a Loja passa a ter estoque
--   OPERACIONAL PRÓPRIO, dividido em dois locais físicos: LOJA e DEPÓSITO.
--   Assim uma venda no balcão baixa o saldo da LOJA sem depender do Omie.
--
--   `loja_produtos` é o cadastro rico e nativo (imagem, categoria, flags de
--   PDV/Cardápio/preparação). Pode opcionalmente apontar para um produto do
--   Omie (`produto_estoque_id` → fato_loja_estoque.produto_id) para
--   reconciliação futura, mas NÃO depende disso para existir.
-- ====================================================================

-- -------------------- CATEGORIAS --------------------
CREATE TABLE loja_categorias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  descricao   text NOT NULL DEFAULT '',
  cor         text,                       -- hex opcional p/ chip no cardápio
  icone       text,                       -- nome de ícone opcional
  ordem       int  NOT NULL DEFAULT 0,
  ativo       boolean NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX loja_categorias_nome_uk ON loja_categorias (lower(nome));
CREATE INDEX loja_categorias_ordem_idx ON loja_categorias (ordem, nome);

-- -------------------- PRODUTOS (cadastro rico e nativo) --------------------
CREATE TABLE loja_produtos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome               text NOT NULL,
  sku                text,
  codigo_barras      text,
  descricao          text NOT NULL DEFAULT '',
  imagem_url         text,
  categoria_id       uuid REFERENCES loja_categorias(id) ON DELETE SET NULL,
  preco              numeric(14,2) NOT NULL DEFAULT 0,
  custo              numeric(14,2),
  unidade            text NOT NULL DEFAULT 'un',
  -- vínculo opcional com o estoque legado do Omie (fato_loja_estoque.produto_id)
  produto_estoque_id bigint,
  -- flags de operação
  ativo              boolean NOT NULL DEFAULT true,
  vende_pdv          boolean NOT NULL DEFAULT true,
  exibe_cardapio     boolean NOT NULL DEFAULT true,
  precisa_preparacao boolean NOT NULL DEFAULT false,
  controla_estoque   boolean NOT NULL DEFAULT true,
  estoque_minimo     numeric(14,3) NOT NULL DEFAULT 0,
  ordem              int NOT NULL DEFAULT 0,
  criado_por_id      uuid,
  criado_em          timestamptz NOT NULL DEFAULT now(),
  atualizado_em      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX loja_produtos_sku_uk ON loja_produtos (lower(sku)) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX loja_produtos_codbar_uk ON loja_produtos (codigo_barras) WHERE codigo_barras IS NOT NULL;
CREATE INDEX loja_produtos_categoria_idx ON loja_produtos (categoria_id);
CREATE INDEX loja_produtos_ativo_idx ON loja_produtos (ativo, ordem, nome);
CREATE INDEX loja_produtos_estoque_ref_idx ON loja_produtos (produto_estoque_id);

-- -------------------- ESTOQUE OPERACIONAL POR LOCAL --------------------
-- Um saldo por (produto, local). Local é físico: LOJA (balcão) ou DEPÓSITO.
CREATE TABLE loja_estoque_saldos (
  produto_id    uuid NOT NULL REFERENCES loja_produtos(id) ON DELETE CASCADE,
  local         text NOT NULL CHECK (local IN ('LOJA','DEPOSITO')),
  saldo_fisico  numeric(14,3) NOT NULL DEFAULT 0,
  reservado     numeric(14,3) NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (produto_id, local),
  -- disponível nunca deixa reservar mais do que existe
  CONSTRAINT loja_estoque_reservado_ok CHECK (reservado >= 0 AND reservado <= saldo_fisico)
);
CREATE INDEX loja_estoque_saldos_local_idx ON loja_estoque_saldos (local);

-- -------------------- LEDGER DE MOVIMENTAÇÕES (rastro) --------------------
-- Toda alteração de saldo passa por aqui: entrada, saída (venda), ajuste,
-- transferência entre locais, devolução, cancelamento, inventário.
CREATE TABLE loja_estoque_movimentos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id    uuid NOT NULL REFERENCES loja_produtos(id) ON DELETE CASCADE,
  local         text NOT NULL CHECK (local IN ('LOJA','DEPOSITO')),
  tipo          text NOT NULL CHECK (tipo IN (
                  'entrada','saida','ajuste','reserva','liberacao',
                  'transferencia','devolucao','cancelamento','inventario'
                )),
  quantidade    numeric(14,3) NOT NULL,   -- assinada: + entra, - sai
  saldo_apos    numeric(14,3),            -- fotografia do saldo após o movimento
  origem        text NOT NULL DEFAULT 'manual', -- manual | pdv | cardapio | compras | transferencia
  referencia_id text,                     -- id de venda/pedido/transferência que originou
  observacao    text NOT NULL DEFAULT '',
  usuario_id    uuid,
  criado_em     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX loja_estoque_mov_produto_idx ON loja_estoque_movimentos (produto_id, criado_em DESC);
CREATE INDEX loja_estoque_mov_local_idx ON loja_estoque_movimentos (local, criado_em DESC);
CREATE INDEX loja_estoque_mov_origem_idx ON loja_estoque_movimentos (origem, referencia_id);

-- -------------------- SEED: categorias base do PRD --------------------
INSERT INTO loja_categorias (nome, ordem) VALUES
  ('Livros', 1),
  ('Camisas', 2),
  ('Garrafas', 3),
  ('Kits', 4),
  ('Acessórios', 5),
  ('Alimentos', 6),
  ('Bebidas', 7),
  ('Outros', 99);
