-- AlterTable
ALTER TABLE "sale_order_payments" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "card_payment_type" "CardPaymentMethodType",
ADD COLUMN     "installments" INTEGER;

-- AlterTable
ALTER TABLE "financial_entries" ADD COLUMN     "acquirer_fee_cents" INTEGER,
ADD COLUMN     "card_contract_id" TEXT,
ADD COLUMN     "card_payment_method_id" TEXT,
ADD COLUMN     "card_settlement_fallback" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gross_amount_cents" INTEGER,
ADD COLUMN     "installment_count" INTEGER,
ADD COLUMN     "installment_sequence" INTEGER,
ADD COLUMN     "sale_order_payment_id" TEXT;

-- CreateIndex
CREATE INDEX "financial_entries_card_contract_id_idx" ON "financial_entries"("card_contract_id");

-- CreateIndex
CREATE INDEX "financial_entries_card_payment_method_id_idx" ON "financial_entries"("card_payment_method_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_entries_sale_order_payment_id_installment_sequenc_key" ON "financial_entries"("sale_order_payment_id", "installment_sequence");

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_card_contract_id_organization_id_fkey" FOREIGN KEY ("card_contract_id", "organization_id") REFERENCES "card_contracts"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_card_payment_method_id_organization_id_fkey" FOREIGN KEY ("card_payment_method_id", "organization_id") REFERENCES "card_payment_methods"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_sale_order_payment_id_organization_id_fkey" FOREIGN KEY ("sale_order_payment_id", "organization_id") REFERENCES "sale_order_payments"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
