-- CreateEnum
CREATE TYPE "clinica"."ClinicPlanLocationUiType" AS ENUM ('tooth', 'face_region', 'body_region', 'session', 'none');

-- AlterTable
ALTER TABLE "clinica"."clinic_plan_specialties"
ADD COLUMN "location_ui_type" "clinica"."ClinicPlanLocationUiType" NOT NULL DEFAULT 'tooth';

-- AlterTable
ALTER TABLE "clinica"."clinic_plan_treatments"
ADD COLUMN "location_ui_type" "clinica"."ClinicPlanLocationUiType";

-- Harmonização Facial (seed odonto) — aba HOF no orçamento
UPDATE "clinica"."clinic_plan_specialties"
SET "location_ui_type" = 'face_region'
WHERE "name" = 'Harmonização Facial';

-- Consultas / outros sem mapa dentário
UPDATE "clinica"."clinic_plan_specialties"
SET "location_ui_type" = 'none'
WHERE "name" IN ('Outros', 'Testes e Exames Laboratoriais');

-- Especialidades fisioterapia (catálogo comercial do pack)
UPDATE "clinica"."clinic_plan_specialties"
SET "location_ui_type" = 'none'
WHERE "name" IN (
  'Avaliação e Consultas',
  'Fisioterapia do Trabalho / Ergonomia',
  'Testes e Avaliações Especializadas',
  'Prevenção e Educação em Saúde'
);

UPDATE "clinica"."clinic_plan_specialties"
SET "location_ui_type" = 'session'
WHERE "name" IN (
  'Pilates Clínico e Condicionamento',
  'Fisioterapia Aquática / Hidroterapia'
);

UPDATE "clinica"."clinic_plan_specialties"
SET "location_ui_type" = 'body_region'
WHERE "name" IN (
  'Fisioterapia Ortopédica e Traumato-Ortopédica',
  'Terapia Manual e Procedimentos Invasivos',
  'Fisioterapia Neurológica',
  'Fisioterapia Esportiva',
  'RPG e Reeducação Postural',
  'Fisioterapia Pélvica e Saúde da Mulher',
  'Fisioterapia Cardiorrespiratória',
  'Fisioterapia Geriátrica',
  'DTM e Fisioterapia Orofacial',
  'Drenagem Linfática e Fisioterapia Vascular',
  'Fisioterapia Dermatofuncional',
  'Fisioterapia Pediátrica',
  'Confecção e Adaptação de Órteses',
  'Avaliação Física e Exames Funcionais',
  'Urgência / Atendimento Agudo'
);
