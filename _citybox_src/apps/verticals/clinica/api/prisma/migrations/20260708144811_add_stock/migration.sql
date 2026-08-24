-- CreateEnum (idempotente: enum pode ter sido criado em tentativa anterior que falhou no AlterEnum)
DO $do$
BEGIN
  -- A checagem PRECISA ser qualificada por schema. Sem o filtro de nspname, o
  -- `erp` (erp-comercio) também tem um enum "StockMovementType": a condição achava o
  -- dele, pulava a criação aqui, e o CREATE TABLE abaixo falhava com
  -- `type "StockMovementType" does not exist`. Quebrava qualquer deploy em que o
  -- schema erp fosse criado antes do clinica.
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'StockMovementType' AND n.nspname = 'clinica'
  ) THEN
    CREATE TYPE "clinica"."StockMovementType" AS ENUM ('entry', 'withdrawal', 'adjustment');
  END IF;
END
$do$;

-- CreateTable
CREATE TABLE "stock_suppliers" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stock_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_products" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sku" TEXT,
    "supplier_id" TEXT,
    "quantity" INTEGER NOT NULL,
    "min_quantity" INTEGER NOT NULL,
    "unit_cost_cents" INTEGER NOT NULL,
    "photo_object_key" VARCHAR(512),
    "photo_mime_type" VARCHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stock_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "clinica"."StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "requested_by_id" TEXT,
    "requested_by_name" TEXT,
    "authorized_by_id" TEXT NOT NULL,
    "authorized_by_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_suppliers_store_id_idx" ON "stock_suppliers"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_suppliers_store_id_name_key" ON "stock_suppliers"("store_id", "name");

-- CreateIndex
CREATE INDEX "stock_products_store_id_idx" ON "stock_products"("store_id");

-- CreateIndex
CREATE INDEX "stock_products_store_id_name_idx" ON "stock_products"("store_id", "name");

-- CreateIndex
CREATE INDEX "stock_products_store_id_category_idx" ON "stock_products"("store_id", "category");

-- CreateIndex
CREATE INDEX "stock_movements_store_id_created_at_idx" ON "stock_movements"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "stock_movements_store_id_type_idx" ON "stock_movements"("store_id", "type");

-- AddForeignKey
ALTER TABLE "stock_products" ADD CONSTRAINT "stock_products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "stock_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "stock_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
