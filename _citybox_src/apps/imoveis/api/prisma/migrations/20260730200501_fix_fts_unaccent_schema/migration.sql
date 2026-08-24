-- Fix: unaccent vive no schema imoveis; triggers falhavam em UPDATE (ex.: checkbox done)
-- porque a sessão Prisma não resolve `unaccent` sem qualificação.

CREATE OR REPLACE FUNCTION imoveis.lead_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO imoveis, public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', imoveis.unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
      coalesce(NEW.email, '') || ' ' ||
      coalesce(NEW.phone, '') || ' ' ||
      coalesce(NEW.property_name, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
      coalesce(NEW.notes, '') || ' ' ||
      coalesce(NEW.city, '') || ' ' ||
      coalesce(NEW.state, '') || ' ' ||
      coalesce(NEW.preferred_location, '') || ' ' ||
      coalesce(NEW.budget_range, '')
    )), 'C');
  RETURN NEW;
END
$$;

CREATE OR REPLACE FUNCTION imoveis.property_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO imoveis, public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', imoveis.unaccent(coalesce(NEW.name, ''))), 'A') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
      coalesce(NEW.address, '') || ' ' ||
      coalesce(NEW.city, '') || ' ' ||
      coalesce(NEW.state, '') || ' ' ||
      coalesce(NEW.type_code, '') || ' ' ||
      coalesce(NEW.zip_code, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
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

CREATE OR REPLACE FUNCTION imoveis.appointment_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO imoveis, public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', imoveis.unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
      coalesce(NEW.lead_name, '') || ' ' ||
      coalesce(NEW.location, '') || ' ' ||
      coalesce(NEW.lead_email, '') || ' ' ||
      coalesce(NEW.lead_phone, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
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

CREATE OR REPLACE FUNCTION imoveis.transaction_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO imoveis, public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', imoveis.unaccent(coalesce(NEW.title, ''))), 'A') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
      coalesce(NEW.property_name, '') || ' ' ||
      coalesce(NEW.lead_name, '') || ' ' ||
      coalesce(NEW.captor_id, '') || ' ' ||
      coalesce(NEW.seller_id, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
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
