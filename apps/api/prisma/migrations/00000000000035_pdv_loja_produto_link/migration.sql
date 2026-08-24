-- ====================================================================
-- FebraHub · Migration 35 — PDV: vincular itens de venda ao catálogo
--   nativo da Loja (loja_produtos) em vez do estoque legado Omie.
--
-- pdv_venda_itens já tem produto_id (BigInt → fato_loja_estoque).
-- Adicionamos loja_produto_id (UUID → loja_produtos) para uso novo.
-- Os dois campos coexistem: vendas novas usam loja_produto_id; vendas
-- antigas continuam com produto_id BigInt para histórico.
-- ====================================================================

ALTER TABLE pdv_venda_itens
  ADD COLUMN IF NOT EXISTS loja_produto_id uuid REFERENCES loja_produtos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pdv_venda_itens_loja_produto_idx
  ON pdv_venda_itens (loja_produto_id);

-- Índice auxiliar para cancelamento: buscar itens por venda + produto
CREATE INDEX IF NOT EXISTS pdv_venda_itens_venda_produto_idx
  ON pdv_venda_itens (venda_id, loja_produto_id)
  WHERE loja_produto_id IS NOT NULL;
