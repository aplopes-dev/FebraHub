-- AlterTable
ALTER TABLE "clinica"."budget_items" ADD COLUMN "session_index" INTEGER,
ADD COLUMN "session_total" INTEGER;

-- AlterTable
ALTER TABLE "clinica"."patient_treatments" ADD COLUMN "session_index" INTEGER,
ADD COLUMN "session_total" INTEGER;

-- Invariante: ambos null OU (total ≥ 2 e 1 ≤ index ≤ total)
ALTER TABLE "clinica"."budget_items"
  ADD CONSTRAINT "chk_budget_item_sessions"
  CHECK (
    ("session_index" IS NULL AND "session_total" IS NULL)
    OR (
      "session_index" IS NOT NULL AND "session_total" IS NOT NULL
      AND "session_total" >= 2
      AND "session_index" >= 1
      AND "session_index" <= "session_total"
    )
  );

ALTER TABLE "clinica"."patient_treatments"
  ADD CONSTRAINT "chk_patient_treatment_sessions"
  CHECK (
    ("session_index" IS NULL AND "session_total" IS NULL)
    OR (
      "session_index" IS NOT NULL AND "session_total" IS NOT NULL
      AND "session_total" >= 2
      AND "session_index" >= 1
      AND "session_index" <= "session_total"
    )
  );
