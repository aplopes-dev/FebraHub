-- Single-city: remove cityId from tenant read models and cart

DROP INDEX IF EXISTS "public"."MarketplaceStore_cityId_storeId_key";
DROP INDEX IF EXISTS "public"."MarketplaceStore_cityId_idx";
ALTER TABLE "public"."MarketplaceStore" DROP COLUMN IF EXISTS "cityId";
CREATE UNIQUE INDEX IF NOT EXISTS "MarketplaceStore_storeId_key" ON "public"."MarketplaceStore"("storeId");

DROP INDEX IF EXISTS "public"."MarketplaceOffer_cityId_itemId_key";
DROP INDEX IF EXISTS "public"."MarketplaceOffer_cityId_storeId_idx";
DROP INDEX IF EXISTS "public"."MarketplaceOffer_cityId_category_idx";
ALTER TABLE "public"."MarketplaceOffer" DROP COLUMN IF EXISTS "cityId";
CREATE UNIQUE INDEX IF NOT EXISTS "MarketplaceOffer_itemId_key" ON "public"."MarketplaceOffer"("itemId");
CREATE INDEX IF NOT EXISTS "MarketplaceOffer_storeId_idx" ON "public"."MarketplaceOffer"("storeId");
CREATE INDEX IF NOT EXISTS "MarketplaceOffer_category_idx" ON "public"."MarketplaceOffer"("category");

DROP INDEX IF EXISTS "public"."MarketplaceAvailability_cityId_storeId_idx";
ALTER TABLE "public"."MarketplaceAvailability" DROP COLUMN IF EXISTS "cityId";
CREATE INDEX IF NOT EXISTS "MarketplaceAvailability_storeId_idx" ON "public"."MarketplaceAvailability"("storeId");

ALTER TABLE "public"."Cart" DROP COLUMN IF EXISTS "cityId";
