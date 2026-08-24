/*
  Warnings:

  - You are about to drop the column `gateway_invoice_id` on the `invoices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gateway_payment_id]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "invoices_gateway_invoice_id_key";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "gateway_invoice_id",
ADD COLUMN     "gateway_payment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_gateway_payment_id_key" ON "invoices"("gateway_payment_id");
