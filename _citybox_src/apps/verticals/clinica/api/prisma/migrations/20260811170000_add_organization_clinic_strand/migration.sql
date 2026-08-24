-- Vertente da clínica na Organization (uma loja = uma vertente).
-- Lojas já provisionadas hidratam como odontologia.

ALTER TABLE "clinica"."organizations"
  ADD COLUMN "clinic_strand" VARCHAR(32) NOT NULL DEFAULT 'odontologia';
