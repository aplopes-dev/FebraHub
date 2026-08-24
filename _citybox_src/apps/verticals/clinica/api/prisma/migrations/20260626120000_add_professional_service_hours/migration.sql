-- CreateTable
CREATE TABLE "clinica"."professional_service_hours" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "default_consultation_minutes" INTEGER NOT NULL DEFAULT 30,
    "fixed_lunch_break_enabled" BOOLEAN NOT NULL DEFAULT false,
    "lunch_break_start" VARCHAR(5),
    "lunch_break_end" VARCHAR(5),
    "week_schedule" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "professional_service_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professional_service_hours_store_id_idx" ON "clinica"."professional_service_hours"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "professional_service_hours_store_id_member_id_key" ON "clinica"."professional_service_hours"("store_id", "member_id");
