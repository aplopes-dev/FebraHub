-- Unifica Professional → Member (padrão Clínica). Banco sem dados a preservar.

-- 1) Soft-ref em appointment_services: remove FK para professionals
ALTER TABLE "beautiful"."appointment_services"
  DROP CONSTRAINT IF EXISTS "appointment_services_professional_id_fkey";

-- 2) Drop tabelas do Professional
DROP TABLE IF EXISTS "beautiful"."professional_work_intervals";
DROP TABLE IF EXISTS "beautiful"."professional_services";
DROP TABLE IF EXISTS "beautiful"."professionals";

-- 3) Contato operacional no Member
ALTER TABLE "beautiful"."members" ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- 4) M2M Member ↔ Service
CREATE TABLE "beautiful"."member_services" (
    "member_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,

    CONSTRAINT "member_services_pkey" PRIMARY KEY ("member_id","service_id")
);

CREATE INDEX "member_services_service_id_idx" ON "beautiful"."member_services"("service_id");

ALTER TABLE "beautiful"."member_services"
  ADD CONSTRAINT "member_services_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "beautiful"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "beautiful"."member_services"
  ADD CONSTRAINT "member_services_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "beautiful"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5) Grade semanal do Member
CREATE TABLE "beautiful"."member_work_intervals" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "weekday" "beautiful"."Weekday" NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "member_work_intervals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "member_work_intervals_member_id_weekday_idx"
  ON "beautiful"."member_work_intervals"("member_id", "weekday");

ALTER TABLE "beautiful"."member_work_intervals"
  ADD CONSTRAINT "member_work_intervals_member_id_fkey"
  FOREIGN KEY ("member_id") REFERENCES "beautiful"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
