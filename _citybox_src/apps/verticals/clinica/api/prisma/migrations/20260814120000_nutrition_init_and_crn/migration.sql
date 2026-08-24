-- Nutrição: source de evolução + pacote Inicializar; conselho CRN
ALTER TYPE "clinica"."TreatmentEvolutionSource" ADD VALUE IF NOT EXISTS 'nutrition_init';
ALTER TYPE "clinica"."ProfessionalCouncilType" ADD VALUE IF NOT EXISTS 'CRN';

CREATE TABLE IF NOT EXISTS "clinica"."patient_nutrition_initiations" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "treatment_id" TEXT NOT NULL,
    "evolution_id" TEXT NOT NULL,
    "anamnesis" JSONB NOT NULL DEFAULT '{}',
    "body" JSONB NOT NULL DEFAULT '{}',
    "treatment_plan" JSONB NOT NULL DEFAULT '{}',
    "professional_id" TEXT,
    "professional_name" TEXT NOT NULL DEFAULT '',
    "initiated_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_nutrition_initiations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "patient_nutrition_initiations_evolution_id_key"
  ON "clinica"."patient_nutrition_initiations"("evolution_id");

CREATE INDEX IF NOT EXISTS "patient_nutrition_initiations_store_id_idx"
  ON "clinica"."patient_nutrition_initiations"("store_id");

CREATE INDEX IF NOT EXISTS "patient_nutrition_initiations_store_id_patient_id_idx"
  ON "clinica"."patient_nutrition_initiations"("store_id", "patient_id");

CREATE INDEX IF NOT EXISTS "patient_nutrition_initiations_treatment_id_idx"
  ON "clinica"."patient_nutrition_initiations"("treatment_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_nutrition_initiations_patient_id_fkey'
  ) THEN
    ALTER TABLE "clinica"."patient_nutrition_initiations"
      ADD CONSTRAINT "patient_nutrition_initiations_patient_id_fkey"
      FOREIGN KEY ("patient_id") REFERENCES "clinica"."patients"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_nutrition_initiations_treatment_id_fkey'
  ) THEN
    ALTER TABLE "clinica"."patient_nutrition_initiations"
      ADD CONSTRAINT "patient_nutrition_initiations_treatment_id_fkey"
      FOREIGN KEY ("treatment_id") REFERENCES "clinica"."patient_treatments"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_nutrition_initiations_evolution_id_fkey'
  ) THEN
    ALTER TABLE "clinica"."patient_nutrition_initiations"
      ADD CONSTRAINT "patient_nutrition_initiations_evolution_id_fkey"
      FOREIGN KEY ("evolution_id") REFERENCES "clinica"."treatment_evolutions"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
