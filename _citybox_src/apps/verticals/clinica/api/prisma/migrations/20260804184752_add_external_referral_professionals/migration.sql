/*
  Warnings:

  - You are about to drop the column `clinic_id` on the `clinic_store_profiles` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "PatientReferralOriginSystemKey" ADD VALUE 'indicacao_profissional_externo';

-- DropIndex
DROP INDEX "clinic_store_profiles_clinic_id_key";

-- AlterTable
ALTER TABLE "clinic_store_profiles" DROP COLUMN "clinic_id";

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "referred_by_external_professional_id" TEXT;

-- CreateTable
CREATE TABLE "external_referral_professionals" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "cro" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "external_referral_professionals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "external_referral_professionals_store_id_idx" ON "external_referral_professionals"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_referral_professionals_store_id_name_key" ON "external_referral_professionals"("store_id", "name");

-- CreateIndex
CREATE INDEX "patients_store_id_referred_by_external_professional_id_idx" ON "patients"("store_id", "referred_by_external_professional_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_referred_by_external_professional_id_fkey" FOREIGN KEY ("referred_by_external_professional_id") REFERENCES "external_referral_professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
