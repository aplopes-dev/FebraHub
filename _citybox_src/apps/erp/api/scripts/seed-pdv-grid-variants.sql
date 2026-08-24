-- Seed idempotente: variações Tamanho/Cor + produtos grade para o PDV.
-- Uso (host):
--   docker cp apps/erp/api/scripts/seed-pdv-grid-variants.sql citybox_postgres:/tmp/seed-pdv-grid-variants.sql
--   docker exec citybox_postgres psql -U citybox -d citybox_platform -f /tmp/seed-pdv-grid-variants.sql
--
-- Bruno Arouca (Caixa 1 pareado) + Kika Modas (Caixa 1 pareado).
-- Liga variant_grid no padrão da loja (Bruno, PDV Teste, Kika).
-- Flatten só emite barcode quando exatamente 1 opção da combinação tem barcode:
--   Calça (só Tamanho) leva EAN nas opções; Camiseta (Tamanho×Cor) não.

BEGIN;

-- ---------------------------------------------------------------------------
-- Bruno Arouca Comercio LTDA
-- ---------------------------------------------------------------------------
INSERT INTO erp.variations (
  id, organization_id, name,
  choose_from, choose_to, charge_from_selected_quantity, charge_from_quantity,
  price_method, created_at, updated_at
) VALUES
  (
    'aaaaaaaa-0001-4000-8000-000000000001',
    '946bf6b5-8b53-45e0-b49e-c353839975e9',
    'Tamanho',
    1, 1, false, 1,
    'sum'::erp."VariationPriceMethod",
    NOW(), NOW()
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000002',
    '946bf6b5-8b53-45e0-b49e-c353839975e9',
    'Cor',
    1, 1, false, 1,
    'sum'::erp."VariationPriceMethod",
    NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.variation_options (
  id, organization_id, variation_id, name, description, image_url,
  price_cents, code, sort_order, created_at, updated_at
) VALUES
  ('aaaaaaaa-0001-4000-8000-000000000011', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000001', 'P', '', NULL, 0, 'P', 0, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000012', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000001', 'M', '', NULL, 0, 'M', 1, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000013', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000001', 'G', '', NULL, 0, 'G', 2, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000021', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000002', 'Preto', '', NULL, 0, 'PRETO', 0, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000022', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000002', 'Branco', '', NULL, 0, 'BRANCO', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.products (
  id, organization_id, name, sku, category_id, unit_of_measure_id,
  type, base_price_cents, perishable, description, image_url, track_stock,
  barcodes, has_variants, variants_count, variation_format,
  deleted_at, created_at, updated_at
) VALUES
  (
    'aaaaaaaa-0001-4000-8000-000000000101',
    '946bf6b5-8b53-45e0-b49e-c353839975e9',
    'Camiseta Grade PDV',
    'CAM-GRD-PDV',
    '4ff7a9d4-70f4-4fda-839f-dc46581bf983',
    '1ed16792-5533-48e4-8412-e49c124e5406',
    'simple'::erp."ProductType",
    4990,
    false,
    'Camiseta com grade Tamanho × Cor para o Balcão.',
    NULL,
    false,
    ARRAY['7891000000103']::text[],
    true,
    6,
    'grid'::erp."ProductVariationFormat",
    NULL,
    NOW(),
    NOW()
  ),
  (
    'aaaaaaaa-0001-4000-8000-000000000102',
    '946bf6b5-8b53-45e0-b49e-c353839975e9',
    'Calça Grade PDV',
    'CAL-GRD-PDV',
    '4ff7a9d4-70f4-4fda-839f-dc46581bf983',
    '1ed16792-5533-48e4-8412-e49c124e5406',
    'simple'::erp."ProductType",
    8990,
    false,
    'Calça com grade só de Tamanho e EAN por SKU.',
    NULL,
    false,
    ARRAY[]::text[],
    true,
    3,
    'grid'::erp."ProductVariationFormat",
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.product_variations (
  id, organization_id, product_id, variation_id,
  min_choices, max_choices, sort_order, created_at, updated_at
) VALUES
  ('aaaaaaaa-0001-4000-8000-000000000201', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000101', 'aaaaaaaa-0001-4000-8000-000000000001', 1, 1, 0, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000202', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000101', 'aaaaaaaa-0001-4000-8000-000000000002', 1, 1, 1, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000203', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000102', 'aaaaaaaa-0001-4000-8000-000000000001', 1, 1, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.product_variation_options (
  id, organization_id, product_variation_id, option_id,
  price_cents, barcode, created_at, updated_at
) VALUES
  ('aaaaaaaa-0001-4000-8000-000000000211', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000201', 'aaaaaaaa-0001-4000-8000-000000000011', NULL, NULL, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000212', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000201', 'aaaaaaaa-0001-4000-8000-000000000012', NULL, NULL, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000213', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000201', 'aaaaaaaa-0001-4000-8000-000000000013', NULL, NULL, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000221', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000202', 'aaaaaaaa-0001-4000-8000-000000000021', NULL, NULL, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000222', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000202', 'aaaaaaaa-0001-4000-8000-000000000022', NULL, NULL, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000231', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000203', 'aaaaaaaa-0001-4000-8000-000000000011', NULL, '7891000000011', NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000232', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000203', 'aaaaaaaa-0001-4000-8000-000000000012', NULL, '7891000000028', NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000233', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000203', 'aaaaaaaa-0001-4000-8000-000000000013', NULL, '7891000000035', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.product_branches (
  id, organization_id, product_id, branch_id, active, created_at, updated_at
) VALUES
  ('aaaaaaaa-0001-4000-8000-000000000301', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000101', 'c4a89e5c-019b-426f-84c2-1cecf5d30379', true, NOW(), NOW()),
  ('aaaaaaaa-0001-4000-8000-000000000302', '946bf6b5-8b53-45e0-b49e-c353839975e9', 'aaaaaaaa-0001-4000-8000-000000000102', 'c4a89e5c-019b-426f-84c2-1cecf5d30379', true, NOW(), NOW())
ON CONFLICT (product_id, branch_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Kika Modas
-- ---------------------------------------------------------------------------
INSERT INTO erp.variations (
  id, organization_id, name,
  choose_from, choose_to, charge_from_selected_quantity, charge_from_quantity,
  price_method, created_at, updated_at
) VALUES
  (
    'bbbbbbbb-0001-4000-8000-000000000001',
    'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40',
    'Tamanho',
    1, 1, false, 1,
    'sum'::erp."VariationPriceMethod",
    NOW(), NOW()
  ),
  (
    'bbbbbbbb-0001-4000-8000-000000000002',
    'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40',
    'Cor',
    1, 1, false, 1,
    'sum'::erp."VariationPriceMethod",
    NOW(), NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.variation_options (
  id, organization_id, variation_id, name, description, image_url,
  price_cents, code, sort_order, created_at, updated_at
) VALUES
  ('bbbbbbbb-0001-4000-8000-000000000011', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000001', 'P', '', NULL, 0, 'P', 0, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000012', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000001', 'M', '', NULL, 0, 'M', 1, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000013', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000001', 'G', '', NULL, 0, 'G', 2, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000021', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000002', 'Preto', '', NULL, 0, 'PRETO', 0, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000022', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000002', 'Branco', '', NULL, 0, 'BRANCO', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.products (
  id, organization_id, name, sku, category_id, unit_of_measure_id,
  type, base_price_cents, perishable, description, image_url, track_stock,
  barcodes, has_variants, variants_count, variation_format,
  deleted_at, created_at, updated_at
) VALUES
  (
    'bbbbbbbb-0001-4000-8000-000000000101',
    'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40',
    'Camiseta Grade PDV',
    'CAM-GRD-PDV',
    '27fe2cdb-3dae-4bf4-a390-4803e913e976',
    '5ff9129a-8d9b-4956-8858-b024bfa994b9',
    'simple'::erp."ProductType",
    4990,
    false,
    'Camiseta com grade Tamanho × Cor para o Balcão.',
    NULL,
    false,
    ARRAY['7891000000103']::text[],
    true,
    6,
    'grid'::erp."ProductVariationFormat",
    NULL,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-0001-4000-8000-000000000102',
    'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40',
    'Calça Grade PDV',
    'CAL-GRD-PDV',
    '27fe2cdb-3dae-4bf4-a390-4803e913e976',
    '5ff9129a-8d9b-4956-8858-b024bfa994b9',
    'simple'::erp."ProductType",
    8990,
    false,
    'Calça com grade só de Tamanho e EAN por SKU.',
    NULL,
    false,
    ARRAY[]::text[],
    true,
    3,
    'grid'::erp."ProductVariationFormat",
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.product_variations (
  id, organization_id, product_id, variation_id,
  min_choices, max_choices, sort_order, created_at, updated_at
) VALUES
  ('bbbbbbbb-0001-4000-8000-000000000201', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000101', 'bbbbbbbb-0001-4000-8000-000000000001', 1, 1, 0, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000202', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000101', 'bbbbbbbb-0001-4000-8000-000000000002', 1, 1, 1, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000203', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000102', 'bbbbbbbb-0001-4000-8000-000000000001', 1, 1, 0, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.product_variation_options (
  id, organization_id, product_variation_id, option_id,
  price_cents, barcode, created_at, updated_at
) VALUES
  ('bbbbbbbb-0001-4000-8000-000000000211', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000201', 'bbbbbbbb-0001-4000-8000-000000000011', NULL, NULL, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000212', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000201', 'bbbbbbbb-0001-4000-8000-000000000012', NULL, NULL, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000213', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000201', 'bbbbbbbb-0001-4000-8000-000000000013', NULL, NULL, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000221', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000202', 'bbbbbbbb-0001-4000-8000-000000000021', NULL, NULL, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000222', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000202', 'bbbbbbbb-0001-4000-8000-000000000022', NULL, NULL, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000231', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000203', 'bbbbbbbb-0001-4000-8000-000000000011', NULL, '7891000000011', NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000232', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000203', 'bbbbbbbb-0001-4000-8000-000000000012', NULL, '7891000000028', NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000233', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000203', 'bbbbbbbb-0001-4000-8000-000000000013', NULL, '7891000000035', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO erp.product_branches (
  id, organization_id, product_id, branch_id, active, created_at, updated_at
) VALUES
  ('bbbbbbbb-0001-4000-8000-000000000301', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000101', '06cff22c-5cab-4ffe-83cf-0fd11b56ab60', true, NOW(), NOW()),
  ('bbbbbbbb-0001-4000-8000-000000000302', 'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40', 'bbbbbbbb-0001-4000-8000-000000000102', '06cff22c-5cab-4ffe-83cf-0fd11b56ab60', true, NOW(), NOW())
ON CONFLICT (product_id, branch_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Padrão da loja: liga variant_grid (o PDV também pede variante sem o módulo)
-- ---------------------------------------------------------------------------
INSERT INTO erp.pos_module_defaults (
  id, organization_id, profile_name, modules, created_at, updated_at
) VALUES
  (
    'aaaaaaaa-0001-4000-8000-000000000099',
    '946bf6b5-8b53-45e0-b49e-c353839975e9',
    NULL,
    '{"variant_grid":"available"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'cccccccc-0001-4000-8000-000000000099',
    'bf047448-f913-4dfc-ad79-2914f619c9bd',
    NULL,
    '{"variant_grid":"available"}'::jsonb,
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-0001-4000-8000-000000000099',
    'b0cc92eb-e5c3-4853-bdb1-8bdaa05e0d40',
    NULL,
    '{"variant_grid":"available"}'::jsonb,
    NOW(),
    NOW()
  )
ON CONFLICT (organization_id) DO UPDATE
SET
  modules = COALESCE(erp.pos_module_defaults.modules, '{}'::jsonb) || '{"variant_grid":"available"}'::jsonb,
  updated_at = NOW();

COMMIT;
