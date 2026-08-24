-- Migra patient_categories.color_id de enum nomeado para hex `#rrggbb`.

ALTER TABLE "clinica"."patient_categories" ADD COLUMN "color_id_hex" VARCHAR(7);

UPDATE "clinica"."patient_categories"
SET "color_id_hex" = CASE "color_id"::text
  WHEN 'blue' THEN '#3b82f6'
  WHEN 'sky' THEN '#0ea5e9'
  WHEN 'cyan' THEN '#06b6d4'
  WHEN 'teal' THEN '#14b8a6'
  WHEN 'emerald' THEN '#10b981'
  WHEN 'green' THEN '#22c55e'
  WHEN 'lime' THEN '#84cc16'
  WHEN 'yellow' THEN '#eab308'
  WHEN 'amber' THEN '#f59e0b'
  WHEN 'orange' THEN '#f97316'
  WHEN 'red' THEN '#ef4444'
  WHEN 'rose' THEN '#f43f5e'
  WHEN 'pink' THEN '#ec4899'
  WHEN 'fuchsia' THEN '#d946ef'
  WHEN 'purple' THEN '#a855f7'
  WHEN 'violet' THEN '#8b5cf6'
  WHEN 'indigo' THEN '#6366f1'
  WHEN 'navy' THEN '#1d4ed8'
  WHEN 'slate' THEN '#64748b'
  WHEN 'brown' THEN '#a16207'
  ELSE '#3b82f6'
END;

ALTER TABLE "clinica"."patient_categories" DROP COLUMN "color_id";

ALTER TABLE "clinica"."patient_categories" RENAME COLUMN "color_id_hex" TO "color_id";

ALTER TABLE "clinica"."patient_categories" ALTER COLUMN "color_id" SET NOT NULL;

DROP TYPE "clinica"."PatientCategoryColorId";
