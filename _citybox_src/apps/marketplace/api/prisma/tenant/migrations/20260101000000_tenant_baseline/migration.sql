-- Baseline tenant (greenfield C-15): multiSchema + UUIDv7.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION citybox_uuid_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  unix_ts_ms bytea;
  uuid_bytes bytea;
BEGIN
  unix_ts_ms := substring(int8send((extract(epoch FROM clock_timestamp()) * 1000)::bigint) FROM 3 FOR 6);
  uuid_bytes := unix_ts_ms || gen_random_bytes(10);
  uuid_bytes := set_byte(uuid_bytes, 6, (get_byte(uuid_bytes, 6) & 15) | 112);
  uuid_bytes := set_byte(uuid_bytes, 8, (get_byte(uuid_bytes, 8) & 63) | 128);
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "beauty";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "clinic";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "food";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "market";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "services";

-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('FOOD', 'RETAIL', 'SERVICE', 'CLINIC');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShippingMode" AS ENUM ('RADIUS', 'NEIGHBORHOOD', 'TABLE');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

-- CreateEnum
CREATE TYPE "food"."StoreTheme" AS ENUM ('warm', 'light', 'dark');

-- CreateEnum
CREATE TYPE "food"."StoreBrandAccent" AS ENUM ('orange', 'emerald', 'slate');

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "name" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryStock" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryReservation" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "orderId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrder" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "orderId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "SubOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingRule" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "mode" "ShippingMode" NOT NULL,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShippingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "eventId" TEXT NOT NULL,
    "consumer" TEXT NOT NULL,
    "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectionReadModel" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProjectionReadModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceStore" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "cityId" TEXT NOT NULL,
    "storeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "neighborhood" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "publishedVersion" INTEGER NOT NULL DEFAULT 1,
    "sourceEventId" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MarketplaceStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceOffer" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "cityId" TEXT NOT NULL,
    "storeId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "price" DECIMAL(12,2),
    "category" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedVersion" INTEGER NOT NULL DEFAULT 1,
    "sourceEventId" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MarketplaceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceAvailability" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "cityId" TEXT NOT NULL,
    "storeId" UUID NOT NULL,
    "sku" TEXT,
    "slotId" UUID,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "quantity" INTEGER,
    "publishedVersion" INTEGER NOT NULL DEFAULT 1,
    "sourceEventId" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MarketplaceAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "sessionId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "cartId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."FoodItem" (
    "catalogItemId" UUID NOT NULL,
    "calories" INTEGER,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("catalogItemId")
);

-- CreateTable
CREATE TABLE "food"."StoreSettings" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "theme" "food"."StoreTheme" NOT NULL DEFAULT 'warm',
    "brandAccent" "food"."StoreBrandAccent" NOT NULL DEFAULT 'orange',
    "displayName" VARCHAR(120),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    "locale" VARCHAR(16) NOT NULL DEFAULT 'pt-BR',
    "logoObjectKey" VARCHAR(512),
    "salonPageTitle" VARCHAR(120),
    "salonPageDescription" VARCHAR(500),
    "salonZones" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."StoreRole" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StoreRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food"."StoreUserRole" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "keycloakSub" TEXT NOT NULL,
    "storeRoleId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StoreUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market"."RetailItem" (
    "catalogItemId" UUID NOT NULL,
    "sku" TEXT NOT NULL,

    CONSTRAINT "RetailItem_pkey" PRIMARY KEY ("catalogItemId")
);

-- CreateTable
CREATE TABLE "beauty"."ServiceItem" (
    "catalogItemId" UUID NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("catalogItemId")
);

-- CreateTable
CREATE TABLE "beauty"."Professional" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beauty"."ScheduleSlot" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "professionalId" UUID NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic"."ClinicItem" (
    "catalogItemId" UUID NOT NULL,
    "procedureCode" TEXT,

    CONSTRAINT "ClinicItem_pkey" PRIMARY KEY ("catalogItemId")
);

-- CreateTable
CREATE TABLE "clinic"."Professional" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic"."ScheduleSlot" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "professionalId" UUID NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services"."ServiceItem" (
    "catalogItemId" UUID NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "ServiceItem_pkey" PRIMARY KEY ("catalogItemId")
);

-- CreateTable
CREATE TABLE "services"."Professional" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "storeId" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services"."ScheduleSlot" (
    "id" UUID NOT NULL DEFAULT citybox_uuid_v7(),
    "professionalId" UUID NOT NULL,
    "startAt" TIMESTAMPTZ(3) NOT NULL,
    "endAt" TIMESTAMPTZ(3) NOT NULL,
    "booked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScheduleSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStock_storeId_sku_key" ON "InventoryStock"("storeId", "sku");

-- CreateIndex
CREATE INDEX "ShippingRule_storeId_idx" ON "ShippingRule"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEvent_eventId_consumer_key" ON "ProcessedEvent"("eventId", "consumer");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectionReadModel_key_key" ON "ProjectionReadModel"("key");

-- CreateIndex
CREATE INDEX "MarketplaceStore_cityId_idx" ON "MarketplaceStore"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceStore_cityId_storeId_key" ON "MarketplaceStore"("cityId", "storeId");

-- CreateIndex
CREATE INDEX "MarketplaceOffer_cityId_storeId_idx" ON "MarketplaceOffer"("cityId", "storeId");

-- CreateIndex
CREATE INDEX "MarketplaceOffer_cityId_category_idx" ON "MarketplaceOffer"("cityId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "MarketplaceOffer_cityId_itemId_key" ON "MarketplaceOffer"("cityId", "itemId");

-- CreateIndex
CREATE INDEX "MarketplaceAvailability_cityId_storeId_idx" ON "MarketplaceAvailability"("cityId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_sessionId_key" ON "Cart"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_storeId_sku_key" ON "CartItem"("cartId", "storeId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "StoreSettings_storeId_key" ON "food"."StoreSettings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreRole_storeId_slug_key" ON "food"."StoreRole"("storeId", "slug");

-- CreateIndex
CREATE INDEX "StoreUserRole_storeId_storeRoleId_idx" ON "food"."StoreUserRole"("storeId", "storeRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreUserRole_storeId_keycloakSub_key" ON "food"."StoreUserRole"("storeId", "keycloakSub");

-- CreateIndex
CREATE INDEX "ScheduleSlot_professionalId_startAt_idx" ON "beauty"."ScheduleSlot"("professionalId", "startAt");

-- CreateIndex
CREATE INDEX "ScheduleSlot_professionalId_startAt_idx" ON "clinic"."ScheduleSlot"("professionalId", "startAt");

-- CreateIndex
CREATE INDEX "ScheduleSlot_professionalId_startAt_idx" ON "services"."ScheduleSlot"("professionalId", "startAt");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."FoodItem" ADD CONSTRAINT "FoodItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food"."StoreUserRole" ADD CONSTRAINT "StoreUserRole_storeRoleId_fkey" FOREIGN KEY ("storeRoleId") REFERENCES "food"."StoreRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market"."RetailItem" ADD CONSTRAINT "RetailItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty"."ServiceItem" ADD CONSTRAINT "ServiceItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beauty"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "beauty"."Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic"."ClinicItem" ADD CONSTRAINT "ClinicItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "clinic"."Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services"."ServiceItem" ADD CONSTRAINT "ServiceItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services"."ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "services"."Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Índices de consulta por loja e outbox
CREATE INDEX "CatalogItem_storeId_idx" ON "public"."CatalogItem"("storeId");
CREATE INDEX "Order_storeId_idx" ON "public"."Order"("storeId");
CREATE INDEX "Order_storeId_status_idx" ON "public"."Order"("storeId", "status");
CREATE INDEX "InventoryReservation_storeId_idx" ON "public"."InventoryReservation"("storeId");
CREATE INDEX "InventoryReservation_expiresAt_idx" ON "public"."InventoryReservation"("expiresAt");
CREATE INDEX "SubOrder_storeId_idx" ON "public"."SubOrder"("storeId");
CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "public"."OutboxEvent"("status", "createdAt");
CREATE INDEX "OutboxEvent_pending_idx" ON "public"."OutboxEvent"("createdAt") WHERE status = 'PENDING';
CREATE INDEX "beauty_Professional_storeId_idx" ON "beauty"."Professional"("storeId");
CREATE INDEX "clinic_Professional_storeId_idx" ON "clinic"."Professional"("storeId");
CREATE INDEX "services_Professional_storeId_idx" ON "services"."Professional"("storeId");
