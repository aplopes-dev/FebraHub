-- CreateEnum

CREATE TYPE "clinica"."AnamnesisTemplateStatus" AS ENUM ('active', 'inactive');



-- CreateEnum

CREATE TYPE "clinica"."AnamnesisQuestionType" AS ENUM ('yes_no_unknown', 'yes_no_unknown_text', 'text', 'left_right_unknown');



-- CreateEnum

CREATE TYPE "clinica"."AnamnesisQuestionScope" AS ENUM ('global', 'clinic');



-- CreateEnum

CREATE TYPE "clinica"."AnamnesisAlertTrigger" AS ENUM ('yes', 'no');



-- CreateTable

CREATE TABLE "clinica"."anamnesis_templates" (

    "id" TEXT NOT NULL,

    "store_id" TEXT NOT NULL,

    "name" TEXT NOT NULL,

    "status" "clinica"."AnamnesisTemplateStatus" NOT NULL DEFAULT 'active',

    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "updated_at" TIMESTAMPTZ(3) NOT NULL,



    CONSTRAINT "anamnesis_templates_pkey" PRIMARY KEY ("id")

);



-- CreateTable

CREATE TABLE "clinica"."anamnesis_questions" (

    "id" TEXT NOT NULL,

    "store_id" TEXT,

    "template_id" TEXT,

    "text" TEXT NOT NULL,

    "type" "clinica"."AnamnesisQuestionType" NOT NULL,

    "scope" "clinica"."AnamnesisQuestionScope" NOT NULL,

    "auxiliary_text" TEXT,

    "generates_alert" BOOLEAN NOT NULL DEFAULT false,

    "alert_when" "clinica"."AnamnesisAlertTrigger",

    "alert_name" TEXT,

    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "updated_at" TIMESTAMPTZ(3) NOT NULL,



    CONSTRAINT "anamnesis_questions_pkey" PRIMARY KEY ("id")

);



-- CreateTable

CREATE TABLE "clinica"."anamnesis_template_questions" (

    "id" TEXT NOT NULL,

    "store_id" TEXT NOT NULL,

    "template_id" TEXT NOT NULL,

    "question_id" TEXT NOT NULL,

    "sort_order" INTEGER NOT NULL,

    "active" BOOLEAN NOT NULL DEFAULT true,

    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    "updated_at" TIMESTAMPTZ(3) NOT NULL,



    CONSTRAINT "anamnesis_template_questions_pkey" PRIMARY KEY ("id")

);



-- CreateIndex

CREATE INDEX "anamnesis_templates_store_id_idx" ON "clinica"."anamnesis_templates"("store_id");



-- CreateIndex

CREATE UNIQUE INDEX "anamnesis_templates_store_id_name_key" ON "clinica"."anamnesis_templates"("store_id", "name");



-- CreateIndex

CREATE INDEX "anamnesis_questions_store_id_idx" ON "clinica"."anamnesis_questions"("store_id");



-- CreateIndex

CREATE INDEX "anamnesis_questions_template_id_idx" ON "clinica"."anamnesis_questions"("template_id");



-- CreateIndex

CREATE INDEX "anamnesis_template_questions_store_id_idx" ON "clinica"."anamnesis_template_questions"("store_id");



-- CreateIndex

CREATE INDEX "anamnesis_template_questions_template_id_idx" ON "clinica"."anamnesis_template_questions"("template_id");



-- CreateIndex

CREATE UNIQUE INDEX "anamnesis_template_questions_template_id_question_id_key" ON "clinica"."anamnesis_template_questions"("template_id", "question_id");



-- AddForeignKey

ALTER TABLE "clinica"."anamnesis_questions" ADD CONSTRAINT "anamnesis_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "clinica"."anamnesis_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- AddForeignKey

ALTER TABLE "clinica"."anamnesis_template_questions" ADD CONSTRAINT "anamnesis_template_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "clinica"."anamnesis_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;



-- AddForeignKey

ALTER TABLE "clinica"."anamnesis_template_questions" ADD CONSTRAINT "anamnesis_template_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "clinica"."anamnesis_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

