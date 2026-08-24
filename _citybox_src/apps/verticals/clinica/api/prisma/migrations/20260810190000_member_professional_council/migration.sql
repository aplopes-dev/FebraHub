-- Inscrição no conselho (CRM/CRO + número + UF) no Member e snapshot em receituário/atestado.

CREATE TYPE "clinica"."ProfessionalCouncilType" AS ENUM ('CRM', 'CRO');

ALTER TABLE "clinica"."members"
  ADD COLUMN "council_type" "clinica"."ProfessionalCouncilType",
  ADD COLUMN "council_number" VARCHAR(20),
  ADD COLUMN "council_uf" CHAR(2);

ALTER TABLE "clinica"."patient_prescriptions"
  ADD COLUMN "council_type" "clinica"."ProfessionalCouncilType",
  ADD COLUMN "council_number" VARCHAR(20),
  ADD COLUMN "council_uf" CHAR(2);

ALTER TABLE "clinica"."patient_certificates"
  ADD COLUMN "council_type" "clinica"."ProfessionalCouncilType",
  ADD COLUMN "council_number" VARCHAR(20),
  ADD COLUMN "council_uf" CHAR(2);
