-- Defesa no banco (database-reviewer Fase 5)
-- from ≠ to
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_different_stocks_check" CHECK ("from_stock_id" <> "to_stock_id");

-- quantity > 0 nas linhas
ALTER TABLE "stock_transfer_lines" ADD CONSTRAINT "stock_transfer_lines_quantity_positive_check" CHECK ("quantity" > 0);

-- índice FK created_by
CREATE INDEX "stock_transfers_created_by_user_id_idx" ON "stock_transfers"("created_by_user_id");

-- refs de movimento 1:1 (NULLs permitidos)
CREATE UNIQUE INDEX "stock_transfers_outbound_movement_id_unique" ON "stock_transfers"("outbound_movement_id") WHERE "outbound_movement_id" IS NOT NULL;
CREATE UNIQUE INDEX "stock_transfers_inbound_movement_id_unique" ON "stock_transfers"("inbound_movement_id") WHERE "inbound_movement_id" IS NOT NULL;
