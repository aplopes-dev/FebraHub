-- CreateEnum
CREATE TYPE "StoreDeploymentStatus" AS ENUM ('PROVISIONING', 'ACTIVE', 'FAILED');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "store_id" TEXT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "store_id" TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "max_negocios" INTEGER,
ADD COLUMN     "tier" TEXT,
ADD COLUMN     "vertical" TEXT;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "billing_email" TEXT,
ADD COLUMN     "deployment_status" "StoreDeploymentStatus" NOT NULL DEFAULT 'PROVISIONING',
ADD COLUMN     "person_type" TEXT,
ADD COLUMN     "responsible_name" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "store_id" TEXT;

-- CreateIndex
CREATE INDEX "invoices_store_id_idx" ON "invoices"("store_id");

-- CreateIndex
CREATE INDEX "members_store_id_idx" ON "members"("store_id");

-- CreateIndex
CREATE INDEX "plans_vertical_idx" ON "plans"("vertical");

-- CreateIndex
CREATE INDEX "subscriptions_store_id_idx" ON "subscriptions"("store_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
