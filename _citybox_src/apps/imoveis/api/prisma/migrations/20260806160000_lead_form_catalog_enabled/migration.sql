-- Formulário de lead no catálogo público (default ligado).
ALTER TABLE "imoveis"."store_settings"
ADD COLUMN IF NOT EXISTS "lead_form_catalog_enabled" BOOLEAN NOT NULL DEFAULT true;
