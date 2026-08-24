-- Permite saldo negativo em stock_balances (política deliberada: PDV/ERP
-- não bloqueiam venda por falta de estoque).
ALTER TABLE "erp"."stock_balances"
  DROP CONSTRAINT IF EXISTS "stock_balances_quantity_non_negative";
