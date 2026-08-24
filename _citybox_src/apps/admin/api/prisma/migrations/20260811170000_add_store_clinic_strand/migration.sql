-- Vertente da clínica (odontologia | fisioterapia). Lojas antigas de Clínica
-- hidratam como odontologia. Fora de Clínica o campo fica null.

ALTER TABLE "platform"."stores"
  ADD COLUMN "clinic_strand" VARCHAR(32);

UPDATE "platform"."stores"
  SET "clinic_strand" = 'odontologia'
  WHERE "vertical" = 'Clínica';
