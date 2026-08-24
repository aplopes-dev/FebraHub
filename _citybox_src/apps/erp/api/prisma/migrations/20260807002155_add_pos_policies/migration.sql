-- CreateTable
CREATE TABLE "pos_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "discount_supervisor_above_percent" INTEGER NOT NULL DEFAULT 10,
    "withdrawal_supervisor_above_cents" INTEGER NOT NULL DEFAULT 50000,
    "cancellation_requires_supervisor" BOOLEAN NOT NULL DEFAULT true,
    "refund_requires_supervisor" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pos_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_policies_organization_id_key" ON "pos_policies"("organization_id");

-- AddForeignKey
ALTER TABLE "pos_policies" ADD CONSTRAINT "pos_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
