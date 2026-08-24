-- CreateTable
CREATE TABLE "store_work_intervals" (
    "id" TEXT NOT NULL,
    "store_settings_id" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "store_work_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_work_intervals_store_settings_id_weekday_idx" ON "store_work_intervals"("store_settings_id", "weekday");

-- AddForeignKey
ALTER TABLE "store_work_intervals" ADD CONSTRAINT "store_work_intervals_store_settings_id_fkey" FOREIGN KEY ("store_settings_id") REFERENCES "store_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: o par open_time/close_time vira um intervalo por dia útil (seg–sex).
INSERT INTO "store_work_intervals" ("id", "store_settings_id", "weekday", "start_time", "end_time", "sort_order")
SELECT
    gen_random_uuid()::text,
    s."id",
    d."weekday"::"Weekday",
    s."open_time",
    s."close_time",
    0
FROM "store_settings" s
CROSS JOIN (VALUES ('mon'), ('tue'), ('wed'), ('thu'), ('fri')) AS d("weekday")
WHERE s."open_time" < s."close_time";

-- AlterTable
ALTER TABLE "store_settings" DROP COLUMN "open_time",
DROP COLUMN "close_time";
