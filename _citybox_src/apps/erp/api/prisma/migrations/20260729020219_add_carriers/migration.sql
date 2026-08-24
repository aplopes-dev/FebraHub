-- CreateEnum
CREATE TYPE "CarrierDeliveryType" AS ENUM ('transportadora', 'entregador');

-- CreateTable
CREATE TABLE "carriers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "person_type" "PersonType" NOT NULL,
    "delivery_type" "CarrierDeliveryType" NOT NULL DEFAULT 'transportadora',
    "name" TEXT NOT NULL,
    "legal_name" TEXT,
    "document" TEXT NOT NULL,
    "icms_exempt" BOOLEAN NOT NULL DEFAULT false,
    "register_in_nfe" BOOLEAN NOT NULL DEFAULT false,
    "state_exempt" BOOLEAN NOT NULL DEFAULT false,
    "state_registration" TEXT,
    "municipal_registration" TEXT,
    "email" TEXT,
    "commercial_phone" TEXT,
    "mobile_phone" TEXT,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "complement" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carriers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrier_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "carrier_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrier_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "carriers_organization_id_idx" ON "carriers"("organization_id");

-- CreateIndex
CREATE INDEX "carriers_organization_id_deleted_at_idx" ON "carriers"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_organization_id_document_key" ON "carriers"("organization_id", "document");

-- CreateIndex
CREATE UNIQUE INDEX "carriers_id_organization_id_key" ON "carriers"("id", "organization_id");

-- CreateIndex
CREATE INDEX "carrier_branches_organization_id_idx" ON "carrier_branches"("organization_id");

-- CreateIndex
CREATE INDEX "carrier_branches_branch_id_idx" ON "carrier_branches"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "carrier_branches_carrier_id_branch_id_key" ON "carrier_branches"("carrier_id", "branch_id");

-- CreateIndex
CREATE INDEX "stock_transfers_carrier_id_idx" ON "stock_transfers"("carrier_id");

-- AddForeignKey
ALTER TABLE "carriers" ADD CONSTRAINT "carriers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_branches" ADD CONSTRAINT "carrier_branches_carrier_id_organization_id_fkey" FOREIGN KEY ("carrier_id", "organization_id") REFERENCES "carriers"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrier_branches" ADD CONSTRAINT "carrier_branches_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_carrier_id_organization_id_fkey" FOREIGN KEY ("carrier_id", "organization_id") REFERENCES "carriers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;
