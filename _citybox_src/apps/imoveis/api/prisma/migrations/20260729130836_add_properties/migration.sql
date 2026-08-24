-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'occupied', 'sold_out', 'reserved');

-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('sale', 'rent');

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "type" "PropertyType" NOT NULL,
    "units" INTEGER NOT NULL DEFAULT 1,
    "cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" "PropertyStatus" NOT NULL DEFAULT 'available',
    "occupied_units" INTEGER,
    "listing_type" "ListingType" NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "floors" INTEGER NOT NULL DEFAULT 1,
    "size_sqm" INTEGER NOT NULL DEFAULT 0,
    "year_built" INTEGER NOT NULL DEFAULT 0,
    "address" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'Brasil',
    "zip_code" TEXT NOT NULL DEFAULT '',
    "map_coordinate" TEXT NOT NULL DEFAULT '',
    "type_code" TEXT,
    "total_active_leads" INTEGER NOT NULL DEFAULT 0,
    "agent_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_photos" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_documents" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size_label" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_active_leads" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_active_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "properties_store_id_idx" ON "properties"("store_id");

-- CreateIndex
CREATE INDEX "properties_store_id_status_idx" ON "properties"("store_id", "status");

-- CreateIndex
CREATE INDEX "properties_store_id_agent_id_idx" ON "properties"("store_id", "agent_id");

-- CreateIndex
CREATE INDEX "properties_store_id_name_idx" ON "properties"("store_id", "name");

-- CreateIndex
CREATE INDEX "properties_store_id_created_at_idx" ON "properties"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "property_photos_property_id_sort_order_idx" ON "property_photos"("property_id", "sort_order");

-- CreateIndex
CREATE INDEX "property_documents_property_id_idx" ON "property_documents"("property_id");

-- CreateIndex
CREATE INDEX "property_active_leads_property_id_sort_order_idx" ON "property_active_leads"("property_id", "sort_order");

-- AddForeignKey
ALTER TABLE "property_photos" ADD CONSTRAINT "property_photos_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_documents" ADD CONSTRAINT "property_documents_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_active_leads" ADD CONSTRAINT "property_active_leads_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
