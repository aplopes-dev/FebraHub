-- Migra cores de categoria (clientes + agendamento) de id nomeado para hex `#rrggbb`.

UPDATE "beautiful"."appointment_categories"
SET "color" = CASE lower("color")
  WHEN 'blue' THEN '#0ea5e9'
  WHEN 'green' THEN '#10b981'
  WHEN 'purple' THEN '#8b5cf6'
  WHEN 'orange' THEN '#f97316'
  WHEN 'red' THEN '#ef4444'
  WHEN 'pink' THEN '#ec4899'
  WHEN 'teal' THEN '#14b8a6'
  WHEN 'amber' THEN '#f59e0b'
  WHEN 'indigo' THEN '#6366f1'
  WHEN 'lime' THEN '#84cc16'
  ELSE CASE
    WHEN "color" ~ '^#[0-9A-Fa-f]{6}$' THEN lower("color")
    ELSE '#3b82f6'
  END
END;

ALTER TABLE "beautiful"."appointment_categories"
  ALTER COLUMN "color" SET DEFAULT '#3b82f6';

ALTER TABLE "beautiful"."appointment_categories"
  ALTER COLUMN "color" TYPE VARCHAR(7);

ALTER TABLE "beautiful"."client_categories" ADD COLUMN "color_id_hex" VARCHAR(7);

UPDATE "beautiful"."client_categories"
SET "color_id_hex" = CASE "color_id"::text
  WHEN 'blue' THEN '#0ea5e9'
  WHEN 'green' THEN '#10b981'
  WHEN 'purple' THEN '#8b5cf6'
  WHEN 'orange' THEN '#f97316'
  WHEN 'red' THEN '#ef4444'
  WHEN 'pink' THEN '#ec4899'
  WHEN 'teal' THEN '#14b8a6'
  WHEN 'amber' THEN '#f59e0b'
  WHEN 'indigo' THEN '#6366f1'
  WHEN 'lime' THEN '#84cc16'
  ELSE '#3b82f6'
END;

ALTER TABLE "beautiful"."client_categories" DROP COLUMN "color_id";

ALTER TABLE "beautiful"."client_categories" RENAME COLUMN "color_id_hex" TO "color_id";

ALTER TABLE "beautiful"."client_categories" ALTER COLUMN "color_id" SET NOT NULL;

ALTER TABLE "beautiful"."client_categories" ALTER COLUMN "color_id" SET DEFAULT '#3b82f6';

DROP TYPE IF EXISTS "beautiful"."ClientCategoryColorId";
DROP TYPE IF EXISTS "ClientCategoryColorId";
