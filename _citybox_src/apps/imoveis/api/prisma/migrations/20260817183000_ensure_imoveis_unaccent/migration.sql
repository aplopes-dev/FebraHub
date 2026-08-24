-- FTS triggers call imoveis.unaccent(text). CREATE EXTENSION unaccent is
-- database-global: on citybox_platform it often already lives in another
-- schema (e.g. erp), so IF NOT EXISTS is a no-op and imoveis.unaccent never
-- appears. Prisma sessions use search_path=imoveis → INSERT/UPDATE 42883.
-- Do not ALTER EXTENSION SET SCHEMA: the citybox database is shared.

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;

DO $$
DECLARE
  src_schema text;
BEGIN
  IF to_regprocedure('imoveis.unaccent(text)') IS NOT NULL THEN
    RETURN;
  END IF;

  SELECT n.nspname
  INTO src_schema
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE p.proname = 'unaccent'
    AND n.nspname <> 'imoveis'
    AND pg_get_function_identity_arguments(p.oid) = 'text'
  ORDER BY CASE n.nspname WHEN 'public' THEN 0 ELSE 1 END
  LIMIT 1;

  IF src_schema IS NULL THEN
    RAISE EXCEPTION 'unaccent(text) not found after CREATE EXTENSION unaccent';
  END IF;

  EXECUTE format(
    $fn$
      CREATE FUNCTION imoveis.unaccent(text)
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
