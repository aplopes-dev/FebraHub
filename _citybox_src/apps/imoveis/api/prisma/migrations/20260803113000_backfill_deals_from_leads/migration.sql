-- Backfill: um Deal ativo por lead (exceto cancelados) que ainda não tem negócio ativo.
-- Etapa inicial derivada do imóvel vinculado ou do snapshot legado `property_name`.

INSERT INTO "deals" (
  "id",
  "store_id",
  "lead_id",
  "property_id",
  "property_name",
  "lead_name",
  "status",
  "stage",
  "title",
  "agent_id",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  l."store_id",
  l."id",
  mp."property_id",
  COALESCE(NULLIF(TRIM(mp."property_name"), ''), NULLIF(TRIM(l."property_name"), ''), ''),
  l."name",
  'active'::"DealStatus",
  CASE
    WHEN mp."property_id" IS NOT NULL THEN 'property_selected'::"DealStage"
    WHEN l."property_name" IS NOT NULL AND TRIM(l."property_name") <> '' THEN 'property_selected'::"DealStage"
    ELSE 'awaiting_property'::"DealStage"
  END,
  CASE
    WHEN mp."property_name" IS NOT NULL AND TRIM(mp."property_name") <> '' THEN
      'Negócio — ' || TRIM(mp."property_name")
    WHEN l."property_name" IS NOT NULL AND TRIM(l."property_name") <> '' THEN
      'Negócio — ' || TRIM(l."property_name")
    ELSE 'Negócio — ' || l."name"
  END,
  l."agent_id",
  NOW(),
  NOW()
FROM "leads" l
LEFT JOIN LATERAL (
  SELECT "property_id", "property_name"
  FROM "lead_matched_properties"
  WHERE "lead_id" = l."id"
  ORDER BY "sort_order" ASC
  LIMIT 1
) mp ON TRUE
WHERE l."status" <> 'cancelled'
  AND NOT EXISTS (
    SELECT 1
    FROM "deals" d
    WHERE d."lead_id" = l."id"
      AND d."status" = 'active'
  );
