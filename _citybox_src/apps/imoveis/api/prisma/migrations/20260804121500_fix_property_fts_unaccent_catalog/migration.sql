-- Corrige trigger de FTS de properties: migration anterior usou unaccent() sem schema
-- (quebra UPDATE via Prisma — ver 20260730200501_fix_fts_unaccent_schema).

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
      coalesce(NEW.zip_code, '') || ' ' ||
      coalesce(NEW.description, '')
    )), 'B') ||
    setweight(to_tsvector('portuguese', imoveis.unaccent(
      coalesce(NEW.type::text, '') || ' ' ||
      coalesce(NEW.status::text, '') || ' ' ||
      coalesce(NEW.listing_type::text, '') || ' ' ||
      coalesce(array_to_string(NEW.highlights, ' '), '') || ' ' ||
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
