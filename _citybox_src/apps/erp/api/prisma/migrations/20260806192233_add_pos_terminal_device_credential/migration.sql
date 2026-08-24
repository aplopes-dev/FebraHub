-- AlterTable
ALTER TABLE "pos_terminals" ADD COLUMN     "device_token_hash" TEXT,
ADD COLUMN     "last_seen_at" TIMESTAMPTZ(3),
ADD COLUMN     "paired_at" TIMESTAMPTZ(3),
ADD COLUMN     "paired_device_label" TEXT;

-- CreateIndex
CREATE INDEX "pos_terminals_pairing_code_idx" ON "pos_terminals"("pairing_code");

-- CreateIndex
CREATE INDEX "pos_terminals_device_token_hash_idx" ON "pos_terminals"("device_token_hash");
