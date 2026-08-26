-- Migration 50: flag "vende_sem_estoque" em loja_produtos
-- Permite que um produto seja vendido mesmo sem saldo disponível.
-- Default FALSE: sem quebra de contrato com produtos existentes.

ALTER TABLE loja_produtos
  ADD COLUMN IF NOT EXISTS vende_sem_estoque BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN loja_produtos.vende_sem_estoque IS
  'Quando TRUE, ignora verificação de saldo disponível no checkout/PDV (vende mesmo sem estoque).';
