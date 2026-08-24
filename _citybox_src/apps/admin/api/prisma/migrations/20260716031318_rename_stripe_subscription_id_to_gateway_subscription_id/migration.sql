/*
  Warnings:

  - You are about to drop the column `stripe_invoice_id` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_subscription_id` on the `subscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gateway_customer_id]` on the table `clients` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gateway_invoice_id]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gateway_subscription_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "subscriptions_stripe_subscription_id_key";

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "gateway_customer_id" TEXT;

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "stripe_invoice_id",
ADD COLUMN     "gateway_invoice_id" TEXT;

-- AlterTable
ALTER TABLE "members" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "stripe_subscription_id",
ADD COLUMN     "gateway_subscription_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clients_gateway_customer_id_key" ON "clients"("gateway_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_gateway_invoice_id_key" ON "invoices"("gateway_invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_gateway_subscription_id_key" ON "subscriptions"("gateway_subscription_id");
