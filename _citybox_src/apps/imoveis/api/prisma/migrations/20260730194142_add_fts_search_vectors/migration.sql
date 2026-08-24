-- AlterTable: FTS columns (Prisma already typed as tsvector)
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- unaccent (idempotent; required for accent-insensitive indexing)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- GIN indexes
CREATE INDEX IF NOT EXISTS "idx_leads_fts" ON "leads" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "idx_properties_fts" ON "properties" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "idx_appointments_fts" ON "appointments" USING GIN ("search_vector");
CREATE INDEX IF NOT EXISTS "idx_transactions_fts" ON "transactions" USING GIN ("search_vector");

-- Lead FTS trigger
CREATE OR REPLACE FUNCTION imoveis.lead_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.email, '') || ' ' ||
      coalesce(NEW.phone, '') || ' ' ||
      coalesce(NEW.property_name, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.notes, '') || ' ' ||
      coalesce(NEW.city, '') || ' ' ||
      coalesce(NEW.state, '') || ' ' ||
      coalesce(NEW.preferred_location, '') || ' ' ||
      coalesce(NEW.budget_range, '')
    )), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS lead_fts_update ON "leads";
CREATE TRIGGER lead_fts_update
  BEFORE INSERT OR UPDATE ON "leads"
  FOR EACH ROW EXECUTE FUNCTION imoveis.lead_search_vector_update();

UPDATE "leads" SET name = name;

-- Property FTS trigger (includes enum labels as searchable text)
CREATE OR REPLACE FUNCTION imoveis.property_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.address, '') || ' ' ||
      coalesce(NEW.city, '') || ' ' ||
      coalesce(NEW.state, '') || ' ' ||
      coalesce(NEW.type_code, '') || ' ' ||
      coalesce(NEW.zip_code, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.type::text, '') || ' ' ||
      coalesce(NEW.status::text, '') || ' ' ||
      coalesce(NEW.listing_type::text, '') || ' ' ||
      CASE NEW.listing_type::text
        WHEN 'sale' THEN 'venda sale'
        WHEN 'rent' THEN 'locacao aluguel rent'
        ELSE ''
      END || ' ' ||
      CASE NEW.status::text
        WHEN 'available' THEN 'disponivel available'
        WHEN 'occupied' THEN 'ocupado occupied'
        WHEN 'sold_out' THEN 'vendido sold'
        WHEN 'reserved' THEN 'reservado reserved'
        ELSE ''
      END
    )), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS property_fts_update ON "properties";
CREATE TRIGGER property_fts_update
  BEFORE INSERT OR UPDATE ON "properties"
  FOR EACH ROW EXECUTE FUNCTION imoveis.property_search_vector_update();

UPDATE "properties" SET name = name;

-- Appointment FTS trigger
CREATE OR REPLACE FUNCTION imoveis.appointment_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.lead_name, '') || ' ' ||
      coalesce(NEW.location, '') || ' ' ||
      coalesce(NEW.lead_email, '') || ' ' ||
      coalesce(NEW.lead_phone, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.description, '') || ' ' ||
      coalesce(NEW.kind::text, '') || ' ' ||
      CASE NEW.kind::text
        WHEN 'visit' THEN 'visita visit'
        WHEN 'follow_up' THEN 'follow-up followup retorno'
        WHEN 'signing' THEN 'assinatura signing'
        ELSE 'outro other'
      END
    )), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS appointment_fts_update ON "appointments";
CREATE TRIGGER appointment_fts_update
  BEFORE INSERT OR UPDATE ON "appointments"
  FOR EACH ROW EXECUTE FUNCTION imoveis.appointment_search_vector_update();

UPDATE "appointments" SET title = title;

-- Transaction FTS trigger
CREATE OR REPLACE FUNCTION imoveis.transaction_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.property_name, '') || ' ' ||
      coalesce(NEW.lead_name, '') || ' ' ||
      coalesce(NEW.captor_id, '') || ' ' ||
      coalesce(NEW.seller_id, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', unaccent(
      coalesce(NEW.rental_landlord_name, '') || ' ' ||
      coalesce(NEW.rental_tenant_name, '') || ' ' ||
      coalesce(NEW.type::text, '') || ' ' ||
      coalesce(NEW.status::text, '') || ' ' ||
      CASE NEW.type::text
        WHEN 'SALE' THEN 'venda sale'
        WHEN 'RENTAL' THEN 'locacao aluguel rental'
        ELSE ''
      END
    )), 'C');
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS transaction_fts_update ON "transactions";
CREATE TRIGGER transaction_fts_update
  BEFORE INSERT OR UPDATE ON "transactions"
  FOR EACH ROW EXECUTE FUNCTION imoveis.transaction_search_vector_update();

UPDATE "transactions" SET title = title;
