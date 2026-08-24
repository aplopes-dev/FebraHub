-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "pdv_code" TEXT,
ADD COLUMN     "pdv_failed_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pdv_locked_until" TIMESTAMPTZ(3),
ADD COLUMN     "pdv_pin_hash" TEXT,
ADD COLUMN     "pdv_pin_updated_at" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "memberships_organization_id_pdv_code_idx" ON "memberships"("organization_id", "pdv_code");
