-- Notas do atendimento nutricional (texto rico + 1 anexo opcional).
-- Sem DELETE por design: a nota é registro clínico, só pode ser editada.
CREATE TABLE IF NOT EXISTS "clinica"."patient_nutrition_notes" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "evolution_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "file_name" TEXT,
    "file_object_key" VARCHAR(512),
    "file_mime_type" VARCHAR(128),
    "file_size_bytes" INTEGER,
    "professional_id" TEXT,
    "professional_name" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_nutrition_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "patient_nutrition_notes_store_id_patient_id_idx"
  ON "clinica"."patient_nutrition_notes"("store_id", "patient_id");

CREATE INDEX IF NOT EXISTS "patient_nutrition_notes_evolution_id_idx"
  ON "clinica"."patient_nutrition_notes"("evolution_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'patient_nutrition_notes_evolution_id_fkey'
  ) THEN
    ALTER TABLE "clinica"."patient_nutrition_notes"
      ADD CONSTRAINT "patient_nutrition_notes_evolution_id_fkey"
      FOREIGN KEY ("evolution_id")
      REFERENCES "clinica"."patient_nutrition_initiations"("evolution_id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
