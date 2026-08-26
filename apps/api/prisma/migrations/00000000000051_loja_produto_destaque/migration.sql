-- Migration 51: adiciona campo em_destaque em loja_produtos
-- Permite marcar produtos como "destaque" para exibição especial no cardápio digital.

ALTER TABLE loja_produtos
  ADD COLUMN IF NOT EXISTS em_destaque BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN loja_produtos.em_destaque
  IS 'Quando true, o produto aparece na seção Destaques do cardápio digital (acima das categorias).';
