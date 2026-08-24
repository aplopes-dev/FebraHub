-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "trade_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'em_implantacao',
    "uses_client_document" BOOLEAN NOT NULL DEFAULT true,
    "document" TEXT,
    "legal_name" TEXT,
    "state_registration" TEXT,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_client_id_idx" ON "stores"("client_id");

-- CreateIndex
CREATE INDEX "stores_status_idx" ON "stores"("status");

-- CreateIndex
CREATE INDEX "stores_vertical_idx" ON "stores"("vertical");

-- CreateIndex
CREATE INDEX "stores_created_at_idx" ON "stores"("created_at");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
