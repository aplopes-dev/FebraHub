-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "is_seller" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "memberships_organization_id_is_seller_idx" ON "memberships"("organization_id", "is_seller");
