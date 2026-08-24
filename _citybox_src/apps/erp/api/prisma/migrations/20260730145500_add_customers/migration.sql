-- CreateEnum
CREATE TYPE "CustomerStage" AS ENUM ('lead', 'opportunity', 'active', 'inactive');


-- CreateEnum
CREATE TYPE "CustomerAddressType" AS ENUM ('principal', 'entrega', 'outro');


-- CreateTable
CREATE TABLE "customer_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customer_categories_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "person_type" "PersonType" NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "rg" TEXT,
    "birth_date" DATE,
    "email" TEXT,
    "mobile_phone" TEXT,
    "phone" TEXT,
    "additional_phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stage" "CustomerStage" NOT NULL DEFAULT 'lead',
    "category_id" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "address_type" "CustomerAddressType" NOT NULL,
    "zip_code" TEXT,
    "street" TEXT,
    "number" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "complement" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "customer_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_branches_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE INDEX "customer_categories_organization_id_idx" ON "customer_categories"("organization_id");


-- CreateIndex
CREATE UNIQUE INDEX "customer_categories_organization_id_name_key" ON "customer_categories"("organization_id", "name");


-- CreateIndex
CREATE INDEX "customers_organization_id_idx" ON "customers"("organization_id");


-- CreateIndex
CREATE INDEX "customers_organization_id_stage_idx" ON "customers"("organization_id", "stage");


-- CreateIndex
CREATE INDEX "customers_organization_id_deleted_at_idx" ON "customers"("organization_id", "deleted_at");


-- CreateIndex
CREATE INDEX "customers_category_id_idx" ON "customers"("category_id");


-- CreateIndex
CREATE UNIQUE INDEX "customers_organization_id_document_key" ON "customers"("organization_id", "document");


-- CreateIndex
CREATE UNIQUE INDEX "customers_id_organization_id_key" ON "customers"("id", "organization_id");


-- CreateIndex
CREATE INDEX "customer_addresses_organization_id_idx" ON "customer_addresses"("organization_id");


-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_idx" ON "customer_addresses"("customer_id");


-- CreateIndex
CREATE INDEX "customer_branches_organization_id_idx" ON "customer_branches"("organization_id");


-- CreateIndex
CREATE INDEX "customer_branches_branch_id_idx" ON "customer_branches"("branch_id");


-- CreateIndex
CREATE UNIQUE INDEX "customer_branches_customer_id_branch_id_key" ON "customer_branches"("customer_id", "branch_id");


-- AddForeignKey
ALTER TABLE "customer_categories" ADD CONSTRAINT "customer_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "customer_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_organization_id_fkey" FOREIGN KEY ("customer_id", "organization_id") REFERENCES "customers"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "customer_branches" ADD CONSTRAINT "customer_branches_customer_id_organization_id_fkey" FOREIGN KEY ("customer_id", "organization_id") REFERENCES "customers"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "customer_branches" ADD CONSTRAINT "customer_branches_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
