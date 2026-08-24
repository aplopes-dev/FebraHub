-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "plan_id" TEXT,
ADD COLUMN     "plan_max_branches" INTEGER,
ADD COLUMN     "plan_max_users" INTEGER,
ADD COLUMN     "plan_tier" TEXT,
ADD COLUMN     "platform_updated_at" TIMESTAMPTZ(3),
ADD COLUMN     "suspended_reason" TEXT,
ADD COLUMN     "synced_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "processed_events" (
    "event_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "processed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE INDEX "processed_events_aggregate_id_idx" ON "processed_events"("aggregate_id");
