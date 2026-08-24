-- Unique: um produto por movimentação
CREATE UNIQUE INDEX "stock_movement_lines_stock_movement_id_product_id_key" ON "erp"."stock_movement_lines"("stock_movement_id", "product_id");

-- CHECK: saldo nunca negativo (defesa no banco além do UPDATE atômico)
ALTER TABLE "erp"."stock_balances" ADD CONSTRAINT "stock_balances_quantity_non_negative" CHECK ("quantity" >= 0);
