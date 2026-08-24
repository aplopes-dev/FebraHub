-- Garante planos base para backfill (tabela criada na migration anterior, sem seed automático)
INSERT INTO "platform"."plans" (
    "id",
    "code",
    "name",
    "description",
    "price_cents",
    "billing_cycle",
    "max_stores",
    "max_users",
    "max_products",
    "status",
    "created_at",
    "updated_at"
)
VALUES
    (
        gen_random_uuid()::text,
        'starter',
        'Starter',
        'Ideal para pequenos negócios que estão começando. Inclui até 1 loja e 3 usuários.',
        9900,
        'MONTHLY',
        1,
        3,
        50,
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'professional',
        'Professional',
        'Para negócios em crescimento com múltiplas lojas e equipe maior.',
        29900,
        'MONTHLY',
        5,
        10,
        500,
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'enterprise',
        'Enterprise',
        'Solução completa para empresas com alto volume de operações.',
        79900,
        'MONTHLY',
        20,
        50,
        NULL,
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'enterprise-plus',
        'Enterprise Plus',
        'Plano premium com suporte dedicado e limites máximos para grandes redes.',
        149900,
        'MONTHLY',
        100,
        200,
        NULL,
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "platform"."clients" ADD COLUMN IF NOT EXISTS "plan_id" TEXT;

DO $migrate$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'platform'
      AND table_name = 'clients'
      AND column_name = 'plan'
  ) THEN
    UPDATE "platform"."clients" AS c
    SET "plan_id" = p."id"
    FROM "platform"."plans" AS p
    WHERE c."plan_id" IS NULL
      AND (
        lower(p."code") = lower(c."plan")
        OR lower(p."name") = lower(c."plan")
      );
  END IF;
END
$migrate$;

UPDATE "platform"."clients" AS c
SET "plan_id" = p."id"
FROM "platform"."plans" AS p
WHERE c."plan_id" IS NULL
  AND p."code" = 'starter';

ALTER TABLE "platform"."clients" DROP COLUMN IF EXISTS "plan";

ALTER TABLE "platform"."clients" ALTER COLUMN "plan_id" SET NOT NULL;

DO $migrate$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_plan_id_fkey'
  ) THEN
    ALTER TABLE "platform"."clients"
    ADD CONSTRAINT "clients_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "platform"."plans"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$migrate$;
