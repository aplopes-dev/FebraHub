ALTER TABLE "beautiful"."professionals" ADD COLUMN "store_id" TEXT NOT NULL;
CREATE INDEX "professionals_store_id_idx" ON "beautiful"."professionals"("store_id");

ALTER TABLE "beautiful"."services" ADD COLUMN "store_id" TEXT NOT NULL;
CREATE INDEX "services_store_id_idx" ON "beautiful"."services"("store_id");

ALTER TABLE "beautiful"."products" ADD COLUMN "store_id" TEXT NOT NULL;
CREATE UNIQUE INDEX "products_store_id_sku_key" ON "beautiful"."products"("store_id", "sku");
CREATE INDEX "products_store_id_idx" ON "beautiful"."products"("store_id");

ALTER TABLE "beautiful"."client_categories" ADD COLUMN "store_id" TEXT NOT NULL;
DROP INDEX IF EXISTS "beautiful"."client_categories_name_key";
CREATE UNIQUE INDEX "client_categories_store_id_name_key" ON "beautiful"."client_categories"("store_id", "name");
CREATE INDEX "client_categories_store_id_idx" ON "beautiful"."client_categories"("store_id");

ALTER TABLE "beautiful"."clients" ADD COLUMN "store_id" TEXT NOT NULL;
DROP INDEX IF EXISTS "beautiful"."clients_name_idx";
DROP INDEX IF EXISTS "beautiful"."clients_phone_idx";
CREATE INDEX "clients_store_id_idx" ON "beautiful"."clients"("store_id");
CREATE INDEX "clients_store_id_name_idx" ON "beautiful"."clients"("store_id", "name");
CREATE INDEX "clients_store_id_phone_idx" ON "beautiful"."clients"("store_id", "phone");

ALTER TABLE "beautiful"."store_settings" ADD COLUMN "store_id" TEXT NOT NULL;
CREATE UNIQUE INDEX "store_settings_store_id_key" ON "beautiful"."store_settings"("store_id");

ALTER TABLE "beautiful"."appointment_categories" ADD COLUMN "store_id" TEXT NOT NULL;
DROP INDEX IF EXISTS "beautiful"."appointment_categories_name_key";
CREATE UNIQUE INDEX "appointment_categories_store_id_name_key" ON "beautiful"."appointment_categories"("store_id", "name");
CREATE INDEX "appointment_categories_store_id_idx" ON "beautiful"."appointment_categories"("store_id");

ALTER TABLE "beautiful"."appointments" ADD COLUMN "store_id" TEXT NOT NULL;
DROP INDEX IF EXISTS "beautiful"."appointments_start_at_end_at_idx";
CREATE INDEX "appointments_store_id_idx" ON "beautiful"."appointments"("store_id");
CREATE INDEX "appointments_store_id_start_at_end_at_idx" ON "beautiful"."appointments"("store_id", "start_at", "end_at");
