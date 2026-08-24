-- DropIndex
DROP INDEX "sale_orders_pos_delivery_order_id_organization_id_key";

-- CreateIndex
CREATE INDEX "sale_orders_organization_id_pos_delivery_order_id_idx" ON "sale_orders"("organization_id", "pos_delivery_order_id");

-- Unique parcial: no máximo uma venda ativa (não cancelada) por delivery.
-- Prisma não modela WHERE em @@unique — mesmo padrão de
-- pos_cash_sessions_one_open_per_terminal.
CREATE UNIQUE INDEX "sale_orders_pos_delivery_order_id_org_active_key"
ON "sale_orders" ("pos_delivery_order_id", "organization_id")
WHERE "pos_delivery_order_id" IS NOT NULL AND "status" <> 'cancelled';
