-- CreateEnum
CREATE TYPE "FinancialEntryStatus" AS ENUM ('pending', 'paid');

-- AlterTable
ALTER TABLE "financial_entries" ADD COLUMN     "fees_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fines_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" "FinancialEntryStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "supplier_id" TEXT;

-- CreateTable
CREATE TABLE "financial_entry_payments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "financial_entry_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "paid_at" DATE NOT NULL,
    "payment_method" TEXT NOT NULL,
    "card_brand" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_entry_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entry_allocations" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "financial_entry_id" TEXT NOT NULL,
    "chart_of_account_id" TEXT NOT NULL,
    "cost_center_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "percentage" DECIMAL(7,4) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_entry_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entry_attachments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "financial_entry_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_entry_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_entry_payments_organization_id_idx" ON "financial_entry_payments"("organization_id");

-- CreateIndex
CREATE INDEX "financial_entry_payments_financial_entry_id_idx" ON "financial_entry_payments"("financial_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entry_payments_id_organization_id_key" ON "financial_entry_payments"("id", "organization_id");

-- CreateIndex
CREATE INDEX "financial_entry_allocations_organization_id_idx" ON "financial_entry_allocations"("organization_id");

-- CreateIndex
CREATE INDEX "financial_entry_allocations_financial_entry_id_idx" ON "financial_entry_allocations"("financial_entry_id");

-- CreateIndex
CREATE INDEX "financial_entry_allocations_chart_of_account_id_idx" ON "financial_entry_allocations"("chart_of_account_id");

-- CreateIndex
CREATE INDEX "financial_entry_allocations_cost_center_id_idx" ON "financial_entry_allocations"("cost_center_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entry_allocations_id_organization_id_key" ON "financial_entry_allocations"("id", "organization_id");

-- CreateIndex
CREATE INDEX "financial_entry_attachments_organization_id_idx" ON "financial_entry_attachments"("organization_id");

-- CreateIndex
CREATE INDEX "financial_entry_attachments_financial_entry_id_idx" ON "financial_entry_attachments"("financial_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entry_attachments_id_organization_id_key" ON "financial_entry_attachments"("id", "organization_id");

-- CreateIndex
CREATE INDEX "financial_entries_organization_id_status_idx" ON "financial_entries"("organization_id", "status");

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_customer_id_organization_id_fkey" FOREIGN KEY ("customer_id", "organization_id") REFERENCES "customers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_supplier_id_organization_id_fkey" FOREIGN KEY ("supplier_id", "organization_id") REFERENCES "suppliers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_payments" ADD CONSTRAINT "financial_entry_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_payments" ADD CONSTRAINT "financial_entry_payments_financial_entry_id_organization_i_fkey" FOREIGN KEY ("financial_entry_id", "organization_id") REFERENCES "financial_entries"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_allocations" ADD CONSTRAINT "financial_entry_allocations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_allocations" ADD CONSTRAINT "financial_entry_allocations_financial_entry_id_organizatio_fkey" FOREIGN KEY ("financial_entry_id", "organization_id") REFERENCES "financial_entries"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_allocations" ADD CONSTRAINT "financial_entry_allocations_chart_of_account_id_organizati_fkey" FOREIGN KEY ("chart_of_account_id", "organization_id") REFERENCES "chart_of_accounts"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_allocations" ADD CONSTRAINT "financial_entry_allocations_cost_center_id_organization_id_fkey" FOREIGN KEY ("cost_center_id", "organization_id") REFERENCES "cost_centers"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_attachments" ADD CONSTRAINT "financial_entry_attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entry_attachments" ADD CONSTRAINT "financial_entry_attachments_financial_entry_id_organizatio_fkey" FOREIGN KEY ("financial_entry_id", "organization_id") REFERENCES "financial_entries"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
