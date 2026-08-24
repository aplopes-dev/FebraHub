-- AlterTable
ALTER TABLE "clinica"."anamnesis_questions" ADD COLUMN "options" JSONB;

-- AlterTable
ALTER TABLE "clinica"."patient_nutrition_initiations" ADD COLUMN "patient_anamnesis_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patient_nutrition_initiations_patient_anamnesis_id_key" ON "clinica"."patient_nutrition_initiations"("patient_anamnesis_id");

-- AddForeignKey
ALTER TABLE "clinica"."patient_nutrition_initiations" ADD CONSTRAINT "patient_nutrition_initiations_patient_anamnesis_id_fkey" FOREIGN KEY ("patient_anamnesis_id") REFERENCES "clinica"."patient_anamneses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Application validates options for single_choice; optional DB guard
ALTER TABLE "clinica"."anamnesis_questions"
  ADD CONSTRAINT "chk_anamnesis_question_options"
  CHECK (type <> 'single_choice'::"clinica"."AnamnesisQuestionType" OR options IS NOT NULL);
