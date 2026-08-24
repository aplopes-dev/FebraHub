-- CreateEnum
CREATE TYPE "SaleOrderStatus" AS ENUM ('open', 'closed', 'cancelled', 'preparing', 'delivering', 'reserved', 'waiting', 'pickup');

-- CreateEnum
CREATE TYPE "SaleOrderChannel" AS ENUM ('pdv', 'delivery', 'marketplace', 'cardapio');

-- CreateEnum
CREATE TYPE "ServiceOrderBaseType" AS ENUM ('open', 'in_progress', 'ready', 'closed', 'canceled');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('leve_mais_pague_menos', 'progressivo', 'desconto_por_valor', 'brinde_por_valor', 'desconto_por_quantidade', 'brinde_por_quantidade', 'cupom');

-- CreateEnum
CREATE TYPE "FinancialEntryOperation" AS ENUM ('receivable', 'payable');

-- AlterEnum
ALTER TYPE "StockMovementSourceType" ADD VALUE 'sale';

-- CreateTable
CREATE TABLE "sale_orders" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "stock_id" TEXT,
    "status" "SaleOrderStatus" NOT NULL DEFAULT 'open',
    "channel_id" "SaleOrderChannel" NOT NULL DEFAULT 'pdv',
    "seller_id" TEXT,
    "seller_name" TEXT NOT NULL DEFAULT '',
    "created_by_name" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "delivery_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "discounts_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    "stock_movement_id" TEXT,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sale_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_order_lines" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sale_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,

    CONSTRAINT "sale_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_order_payments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "sale_order_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "method_id" TEXT NOT NULL,
    "bank_account_id" TEXT,

    CONSTRAINT "sale_order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_statuses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base_type" "ServiceOrderBaseType" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_order_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL DEFAULT '',
    "status_id" TEXT NOT NULL,
    "seller_name" TEXT NOT NULL DEFAULT '',
    "technician_name" TEXT NOT NULL DEFAULT '',
    "opened_at" TIMESTAMPTZ(3) NOT NULL,
    "due_at" TIMESTAMPTZ(3),
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "budgeted_cents" INTEGER NOT NULL DEFAULT 0,
    "diagnosis_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "approval_notes" TEXT NOT NULL DEFAULT '',
    "approved_at" TIMESTAMPTZ(3),
    "generated_sale_id" TEXT,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_statuses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "contract_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_contracts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "customer_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "status_id" TEXT NOT NULL,
    "seller_name" TEXT NOT NULL DEFAULT '',
    "starts_at" DATE NOT NULL,
    "ends_at" DATE,
    "total_cents" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "duration_type" TEXT NOT NULL DEFAULT 'times',
    "duration_value" INTEGER NOT NULL DEFAULT 12,
    "first_due_date" DATE NOT NULL,
    "payload_json" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sales_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_installments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "financial_entry_id" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "PromotionType" NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "rules_json" JSONB NOT NULL DEFAULT '{}',
    "branch_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL DEFAULT '',
    "opening_balance_cents" INTEGER NOT NULL DEFAULT 0,
    "opened_at" DATE NOT NULL,
    "branch_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_entries" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "operation" "FinancialEntryOperation" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "amount_cents" INTEGER NOT NULL,
    "paid_cents" INTEGER NOT NULL DEFAULT 0,
    "competence_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "party_name" TEXT NOT NULL DEFAULT '',
    "customer_id" TEXT,
    "bank_account_id" TEXT,
    "sale_order_id" TEXT,
    "category_name" TEXT NOT NULL DEFAULT '',
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sale_orders_organization_id_deleted_at_idx" ON "sale_orders"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "sale_orders_organization_id_status_idx" ON "sale_orders"("organization_id", "status");

-- CreateIndex
CREATE INDEX "sale_orders_organization_id_created_at_idx" ON "sale_orders"("organization_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sale_orders_organization_id_number_key" ON "sale_orders"("organization_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "sale_orders_id_organization_id_key" ON "sale_orders"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sale_order_lines_organization_id_idx" ON "sale_order_lines"("organization_id");

-- CreateIndex
CREATE INDEX "sale_order_lines_sale_order_id_idx" ON "sale_order_lines"("sale_order_id");

-- CreateIndex
CREATE INDEX "sale_order_lines_product_id_idx" ON "sale_order_lines"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_order_lines_sale_order_id_product_id_key" ON "sale_order_lines"("sale_order_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_order_lines_id_organization_id_key" ON "sale_order_lines"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sale_order_payments_organization_id_idx" ON "sale_order_payments"("organization_id");

-- CreateIndex
CREATE INDEX "sale_order_payments_sale_order_id_idx" ON "sale_order_payments"("sale_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_order_payments_id_organization_id_key" ON "sale_order_payments"("id", "organization_id");

-- CreateIndex
CREATE INDEX "service_order_statuses_organization_id_idx" ON "service_order_statuses"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_order_statuses_id_organization_id_key" ON "service_order_statuses"("id", "organization_id");

-- CreateIndex
CREATE INDEX "service_orders_organization_id_deleted_at_idx" ON "service_orders"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "service_orders_organization_id_status_id_idx" ON "service_orders"("organization_id", "status_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_organization_id_code_key" ON "service_orders"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_id_organization_id_key" ON "service_orders"("id", "organization_id");

-- CreateIndex
CREATE INDEX "contract_statuses_organization_id_idx" ON "contract_statuses"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_statuses_id_organization_id_key" ON "contract_statuses"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sales_contracts_organization_id_deleted_at_idx" ON "sales_contracts"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_contracts_organization_id_number_key" ON "sales_contracts"("organization_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_contracts_id_organization_id_key" ON "sales_contracts"("id", "organization_id");

-- CreateIndex
CREATE INDEX "contract_installments_organization_id_idx" ON "contract_installments"("organization_id");

-- CreateIndex
CREATE INDEX "contract_installments_contract_id_idx" ON "contract_installments"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_installments_contract_id_sequence_key" ON "contract_installments"("contract_id", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "contract_installments_id_organization_id_key" ON "contract_installments"("id", "organization_id");

-- CreateIndex
CREATE INDEX "promotions_organization_id_deleted_at_idx" ON "promotions"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "promotions_organization_id_type_idx" ON "promotions"("organization_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_id_organization_id_key" ON "promotions"("id", "organization_id");

-- CreateIndex
CREATE INDEX "bank_accounts_organization_id_deleted_at_idx" ON "bank_accounts"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_id_organization_id_key" ON "bank_accounts"("id", "organization_id");

-- CreateIndex
CREATE INDEX "financial_entries_organization_id_deleted_at_idx" ON "financial_entries"("organization_id", "deleted_at");

-- CreateIndex
CREATE INDEX "financial_entries_organization_id_operation_idx" ON "financial_entries"("organization_id", "operation");

-- CreateIndex
CREATE INDEX "financial_entries_organization_id_competence_date_idx" ON "financial_entries"("organization_id", "competence_date");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entries_id_organization_id_key" ON "financial_entries"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_customer_id_organization_id_fkey" FOREIGN KEY ("customer_id", "organization_id") REFERENCES "customers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_stock_id_organization_id_fkey" FOREIGN KEY ("stock_id", "organization_id") REFERENCES "stocks"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_lines" ADD CONSTRAINT "sale_order_lines_sale_order_id_organization_id_fkey" FOREIGN KEY ("sale_order_id", "organization_id") REFERENCES "sale_orders"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_lines" ADD CONSTRAINT "sale_order_lines_product_id_organization_id_fkey" FOREIGN KEY ("product_id", "organization_id") REFERENCES "products"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_lines" ADD CONSTRAINT "sale_order_lines_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_payments" ADD CONSTRAINT "sale_order_payments_sale_order_id_organization_id_fkey" FOREIGN KEY ("sale_order_id", "organization_id") REFERENCES "sale_orders"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_payments" ADD CONSTRAINT "sale_order_payments_bank_account_id_organization_id_fkey" FOREIGN KEY ("bank_account_id", "organization_id") REFERENCES "bank_accounts"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_order_payments" ADD CONSTRAINT "sale_order_payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_statuses" ADD CONSTRAINT "service_order_statuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_organization_id_fkey" FOREIGN KEY ("customer_id", "organization_id") REFERENCES "customers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_status_id_organization_id_fkey" FOREIGN KEY ("status_id", "organization_id") REFERENCES "service_order_statuses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_generated_sale_id_organization_id_fkey" FOREIGN KEY ("generated_sale_id", "organization_id") REFERENCES "sale_orders"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_statuses" ADD CONSTRAINT "contract_statuses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_customer_id_organization_id_fkey" FOREIGN KEY ("customer_id", "organization_id") REFERENCES "customers"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_contracts" ADD CONSTRAINT "sales_contracts_status_id_organization_id_fkey" FOREIGN KEY ("status_id", "organization_id") REFERENCES "contract_statuses"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_installments" ADD CONSTRAINT "contract_installments_contract_id_organization_id_fkey" FOREIGN KEY ("contract_id", "organization_id") REFERENCES "sales_contracts"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_installments" ADD CONSTRAINT "contract_installments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_installments" ADD CONSTRAINT "contract_installments_financial_entry_id_organization_id_fkey" FOREIGN KEY ("financial_entry_id", "organization_id") REFERENCES "financial_entries"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_bank_account_id_organization_id_fkey" FOREIGN KEY ("bank_account_id", "organization_id") REFERENCES "bank_accounts"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

