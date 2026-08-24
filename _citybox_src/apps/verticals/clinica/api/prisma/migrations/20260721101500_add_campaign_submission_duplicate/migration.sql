-- Reconciliação: coluna criada manualmente pelo operador em jul/2026 (marketing form_lead).
-- IF NOT EXISTS torna a migration segura em bancos onde a coluna já existe.
ALTER TABLE "clinica"."campaign_submissions"
ADD COLUMN IF NOT EXISTS "is_duplicate" BOOLEAN NOT NULL DEFAULT false;
