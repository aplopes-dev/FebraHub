-- CreateIndex
CREATE INDEX "inventories_stock_id_created_at_idx" ON "inventories"("stock_id", "created_at");

-- CreateIndex
CREATE INDEX "production_orders_organization_id_status_created_at_idx" ON "production_orders"("organization_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "purchases_organization_id_deleted_at_purchased_at_idx" ON "purchases"("organization_id", "deleted_at", "purchased_at");

-- CreateIndex
CREATE INDEX "stock_balances_stock_id_quantity_idx" ON "stock_balances"("stock_id", "quantity");

-- CreateIndex
CREATE INDEX "stock_transfers_organization_id_status_operated_at_idx" ON "stock_transfers"("organization_id", "status", "operated_at");
