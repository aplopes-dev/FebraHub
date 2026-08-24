-- FTS global search (pacientes, agenda, oportunidades, estoque)
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
ALTER TABLE "sales_opportunities" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
ALTER TABLE "stock_products" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

DO $$
DECLARE
  src_schema text;
BEGIN
  IF to_regprocedure('clinica.unaccent(text)') IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT n.nspname
  INTO src_schema
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'unaccent'
    AND n.nspname <> 'clinica'
    AND pg_get_function_identity_arguments(p.oid) = 'text'
  ORDER BY CASE n.nspname WHEN 'public' THEN 0 ELSE 1 END
  LIMIT 1;

  IF src_schema IS NULL THEN
    RAISE EXCEPTION 'unaccent(text) not found after CREATE EXTENSION unaccent';
  END IF;

  EXECUTE format(
    $fn$
      CREATE FUNCTION clinica.unaccent(text)
      RETURNS text
      LANGUAGE sql
      IMMUTABLE
      PARALLEL SAFE
      STRICT
      AS %L
    $fn$,
    format('SELECT %I.unaccent($1)', src_schema)
  );
END
$$;

CREATE INDEX IF NOT EXISTS "idx_patients_fts" ON "patients" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "idx_appointments_fts" ON "appointments" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "idx_sales_opportunities_fts" ON "sales_opportunities" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "idx_stock_products_fts" ON "stock_products" USING GIN ("search_vector");

CREATE OR REPLACE FUNCTION clinica.patient_search_vector_update()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO clinica, public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(
      coalesce(NEW.cpf, '') || ' ' ||
      coalesce(NEW.phone, '') || ' ' ||
      coalesce(NEW.landline_phone, '') || ' ' ||
      coalesce(NEW.email, '') || ' ' ||
      coalesce(NEW.medical_record_number, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(
      coalesce(NEW.guardian_name, '') || ' ' ||
      coalesce(NEW.guardian_phone, '')
    )), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS patient_fts_update ON "patients";
CREATE TRIGGER patient_fts_update
  BEFORE INSERT OR UPDATE ON "patients"
  FOR EACH ROW EXECUTE FUNCTION clinica.patient_search_vector_update();

UPDATE "patients" SET name = name;

CREATE OR REPLACE FUNCTION clinica.appointment_search_vector_update()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO clinica, public
AS $$
DECLARE
  patient_name text;
  category_name text;
BEGIN
  SELECT p.name INTO patient_name FROM patients p WHERE p.id = NEW.patient_id;
  SELECT c.name INTO category_name FROM appointment_categories c WHERE c.id = NEW.category_id;

  NEW.search_vector :=
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(patient_name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(NEW.notes, ''))), 'B') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(category_name, ''))), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS appointment_fts_update ON "appointments";
CREATE TRIGGER appointment_fts_update
  BEFORE INSERT OR UPDATE ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION clinica.appointment_search_vector_update();

UPDATE "appointments" SET id = id;

CREATE OR REPLACE FUNCTION clinica.sales_opportunity_search_vector_update()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO clinica, public
AS $$
DECLARE
  patient_name text;
BEGIN
  IF NEW.patient_id IS NOT NULL THEN
    SELECT p.name INTO patient_name FROM patients p WHERE p.id = NEW.patient_id;
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(
      coalesce(NEW.phone, '') || ' ' ||
      coalesce(patient_name, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(NEW.description, ''))), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS sales_opportunity_fts_update ON "sales_opportunities";
CREATE TRIGGER sales_opportunity_fts_update
  BEFORE INSERT OR UPDATE ON "sales_opportunities"
  FOR EACH ROW EXECUTE FUNCTION clinica.sales_opportunity_search_vector_update();

UPDATE "sales_opportunities" SET title = title;

CREATE OR REPLACE FUNCTION clinica.stock_product_search_vector_update()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO clinica, public
AS $$
DECLARE
  supplier_name text;
BEGIN
  IF NEW.supplier_id IS NOT NULL THEN
    SELECT s.name INTO supplier_name FROM stock_suppliers s WHERE s.id = NEW.supplier_id;
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(
      coalesce(NEW.sku, '') || ' ' ||
      coalesce(NEW.category, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', clinica.unaccent(coalesce(supplier_name, ''))), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS stock_product_fts_update ON "stock_products";
CREATE TRIGGER stock_product_fts_update
  BEFORE INSERT OR UPDATE ON "stock_products"
  FOR EACH ROW EXECUTE FUNCTION clinica.stock_product_search_vector_update();

UPDATE "stock_products" SET name = name;
