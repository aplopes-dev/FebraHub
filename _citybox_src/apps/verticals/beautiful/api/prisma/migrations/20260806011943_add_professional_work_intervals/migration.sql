-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');

-- CreateTable
CREATE TABLE "professional_work_intervals" (
    "id" TEXT NOT NULL,
    "professional_id" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "professional_work_intervals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professional_work_intervals_professional_id_weekday_idx" ON "professional_work_intervals"("professional_id", "weekday");

-- AddForeignKey
ALTER TABLE "professional_work_intervals" ADD CONSTRAINT "professional_work_intervals_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
