-- CreateEnum
CREATE TYPE "PatientReferralOriginSystemKey" AS ENUM ('indicacao', 'indicacao_profissional', 'google', 'instagram', 'facebook', 'outro');

-- CreateTable
CREATE TABLE "patient_referral_origins" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "system_key" "PatientReferralOriginSystemKey",
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_referral_origins_pkey" PRIMARY KEY ("id")
);

-- AlterTable: new columns (keep referral_source for backfill)
ALTER TABLE "patients" ADD COLUMN     "referral_origin_id" TEXT,
ADD COLUMN     "referred_by_member_id" TEXT,
ADD COLUMN     "referred_by_member_name" TEXT,
ADD COLUMN     "referred_by_patient_id" TEXT;

-- Seed system origins for every store that already has patients or categories
INSERT INTO "patient_referral_origins" ("id", "store_id", "name", "system_key", "is_system", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  s.store_id,
  v.name,
  v.system_key::"PatientReferralOriginSystemKey",
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "store_id" AS store_id FROM "patients"
  UNION
  SELECT DISTINCT "store_id" AS store_id FROM "patient_categories"
) AS s
CROSS JOIN (
  VALUES
    ('indicacao', 'Indicado por outro paciente'),
    ('indicacao_profissional', 'Indicado por outro profissional da equipe'),
    ('google', 'Google'),
    ('instagram', 'Instagram'),
    ('facebook', 'Facebook'),
    ('outro', 'Outro')
) AS v(system_key, name);

-- Backfill FK from legacy enum referral_source → system origin
UPDATE "patients" AS p
SET "referral_origin_id" = o."id"
FROM "patient_referral_origins" AS o
WHERE o."store_id" = p."store_id"
  AND o."system_key"::text = p."referral_source"::text
  AND p."referral_source" IS NOT NULL;

-- Drop legacy column + enum
ALTER TABLE "patients" DROP COLUMN "referral_source";
DROP TYPE "PatientReferralSource";

-- CreateIndex
CREATE INDEX "patient_referral_origins_store_id_idx" ON "patient_referral_origins"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_referral_origins_store_id_name_key" ON "patient_referral_origins"("store_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "patient_referral_origins_store_id_system_key_key" ON "patient_referral_origins"("store_id", "system_key");

-- CreateIndex
CREATE INDEX "patients_store_id_referral_origin_id_idx" ON "patients"("store_id", "referral_origin_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_referral_origin_id_fkey" FOREIGN KEY ("referral_origin_id") REFERENCES "patient_referral_origins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_referred_by_patient_id_fkey" FOREIGN KEY ("referred_by_patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
