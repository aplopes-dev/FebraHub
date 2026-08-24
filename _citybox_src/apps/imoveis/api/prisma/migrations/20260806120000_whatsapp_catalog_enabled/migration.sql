-- Botão WhatsApp no catálogo público (default ligado).
ALTER TABLE "imoveis"."store_settings"
ADD COLUMN IF NOT EXISTS "whatsapp_catalog_enabled" BOOLEAN NOT NULL DEFAULT true;
