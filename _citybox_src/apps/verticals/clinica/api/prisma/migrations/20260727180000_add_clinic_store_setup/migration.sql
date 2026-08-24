-- CreateTable
CREATE TABLE "clinica"."clinic_stores" (
    "store_id" TEXT NOT NULL,
    "trade_name" TEXT NOT NULL,
    "legal_name" TEXT,
    "slug" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "document" TEXT,
    "state_registration" TEXT,
    "uses_client_document" BOOLEAN NOT NULL DEFAULT true,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" VARCHAR(2),
    "phone" TEXT,
    "timezone" TEXT NOT NULL,
    "platform_updated_at" TIMESTAMPTZ(3) NOT NULL,
    "synced_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_stores_pkey" PRIMARY KEY ("store_id")
);

-- CreateTable
CREATE TABLE "clinica"."clinic_store_setups" (
    "store_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_store_setups_pkey" PRIMARY KEY ("store_id")
);

-- CreateIndex
CREATE INDEX "clinic_stores_vertical_idx" ON "clinica"."clinic_stores"("vertical");
