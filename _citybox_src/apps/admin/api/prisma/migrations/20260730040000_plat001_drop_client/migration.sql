-- PLAT-001 / Fase 10 — migration de CONTRAÇÃO: remove o conceito de `Client`.
--
-- A Loja passou a ser a unidade de billing (ADR PLAT-001). Os dados cadastrais e de
-- cobrança já foram copiados para `stores` na migration de expansão
-- (20260718170018_store_billing_expand) e pelo script de backfill que rodou junto com
-- ela. Os dois scripts (`backfill-store-billing.ts`, `report-legacy-client-store-counts.ts`)
-- foram removidos nesta fase: eram tipados contra o model `Client`, que deixa de existir
-- aqui, então não compilariam mais. As guardas abaixo cobrem o que eles verificavam.
-- Esta migration é irreversível: `clients` deixa de existir.

-- ---------------------------------------------------------------------------
-- 0. Guardas. Falhar aqui é MUITO melhor que dropar dado silenciosamente.
-- ---------------------------------------------------------------------------

-- 0.1 Toda assinatura e fatura precisa de loja: as colunas viram NOT NULL abaixo.
DO $$
DECLARE
  orphan_subs   bigint;
  orphan_invs   bigint;
BEGIN
  SELECT count(*) INTO orphan_subs FROM "subscriptions" WHERE "store_id" IS NULL;
  SELECT count(*) INTO orphan_invs FROM "invoices" WHERE "store_id" IS NULL;

  IF orphan_subs > 0 OR orphan_invs > 0 THEN
    RAISE EXCEPTION
      'PLAT-001: % assinatura(s) e % fatura(s) sem store_id. Preencha store_id (a partir de clients.stores) antes desta migration.',
      orphan_subs, orphan_invs;
  END IF;
END $$;

-- 0.2 Nenhuma loja pode PERDER documento. `uses_client_document = true` significava
--     "meu documento é o do cliente"; ao dropar `clients` essa loja ficaria sem
--     documento nenhum, e sem como emitir cobrança. Só é erro quando havia documento no
--     cliente e não há na loja — loja em setup sem documento em lado nenhum não perde
--     nada e passa.
DO $$
DECLARE
  losing_document bigint;
BEGIN
  SELECT count(*) INTO losing_document
  FROM "stores" s
  JOIN "clients" c ON c."id" = s."client_id"
  WHERE (s."document" IS NULL OR btrim(s."document") = '')
    AND c."document" IS NOT NULL
    AND btrim(c."document") <> '';

  IF losing_document > 0 THEN
    RAISE EXCEPTION
      'PLAT-001: % loja(s) herdavam o documento do cliente e não têm o próprio. Copie clients.document/person_type para stores antes desta migration.',
      losing_document;
  END IF;
END $$;

-- 0.3 A loja não pode acumular assinatura ativa. O UNIQUE parcial atual é por
--     `client_id` e será destruído junto com a coluna (Postgres dropa índices que a
--     referenciam). Se já houver duplicidade, o índice novo falharia adiante — melhor
--     avisar com a mensagem certa aqui.
DO $$
DECLARE
  duplicated bigint;
BEGIN
  SELECT count(*) INTO duplicated FROM (
    SELECT "store_id"
    FROM "subscriptions"
    WHERE "status" IN ('ACTIVE', 'TRIALING')
    GROUP BY "store_id"
    HAVING count(*) > 1
  ) dup;

  IF duplicated > 0 THEN
    RAISE EXCEPTION
      'PLAT-001: % loja(s) com mais de uma assinatura ACTIVE/TRIALING. Cancele as duplicadas antes de mover o UNIQUE de cliente para loja.',
      duplicated;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 0.9 Migra `gateway_customer_id` de `clients` para `stores`.
--
-- Este id é a chave que o webhook do PSP (Asaas) usa para descobrir a que entidade
-- local um pagamento pertence. Vivia só em `clients`; sem copiá-lo ANTES do drop, todo
-- pagamento recebido depois ficaria sem destino — e o webhook não tem como reclamar,
-- porque para ele a resposta "não achei" é indistinguível de "não é meu".
--
-- Um cliente podia ter N lojas e o id do PSP é único: fica com a loja mais antiga
-- (a que originou o cadastro no PSP). As demais recebem id próprio no primeiro
-- faturamento.
-- ---------------------------------------------------------------------------
ALTER TABLE "stores" ADD COLUMN "gateway_customer_id" TEXT;

UPDATE "stores" s
SET "gateway_customer_id" = c."gateway_customer_id"
FROM "clients" c
WHERE c."id" = s."client_id"
  AND c."gateway_customer_id" IS NOT NULL
  AND s."id" = (
    SELECT s2."id"
    FROM "stores" s2
    WHERE s2."client_id" = c."id"
    ORDER BY s2."created_at" ASC, s2."id" ASC
    LIMIT 1
  );

CREATE UNIQUE INDEX "stores_gateway_customer_id_key" ON "stores"("gateway_customer_id");

-- ---------------------------------------------------------------------------
-- 1. Foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_client_id_fkey";
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_store_id_fkey";
ALTER TABLE "members" DROP CONSTRAINT "members_client_id_fkey";
ALTER TABLE "members" DROP CONSTRAINT "members_store_id_fkey";
ALTER TABLE "stores" DROP CONSTRAINT "stores_client_id_fkey";
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_client_id_fkey";
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_store_id_fkey";

-- ---------------------------------------------------------------------------
-- 2. Índices
-- ---------------------------------------------------------------------------
DROP INDEX "invoices_client_id_idx";
DROP INDEX "members_store_id_idx";
DROP INDEX "stores_client_id_idx";
DROP INDEX "subscriptions_client_id_idx";

-- ---------------------------------------------------------------------------
-- 3. Colunas
-- ---------------------------------------------------------------------------

-- `members.store_id` sai junto com `client_id`: o vínculo real de um membro com lojas é
-- `store_members` (N lojas por membro). A coluna escalar nunca conseguiu expressar isso
-- e estava nula em todas as linhas — mantê-la convidaria código novo a confiar nela.
ALTER TABLE "members" DROP COLUMN "client_id",
                      DROP COLUMN "store_id";

ALTER TABLE "stores" DROP COLUMN "client_id",
                     DROP COLUMN "uses_client_document";

ALTER TABLE "subscriptions" DROP COLUMN "client_id",
                            ALTER COLUMN "store_id" SET NOT NULL;

ALTER TABLE "invoices" DROP COLUMN "client_id",
                       ALTER COLUMN "store_id" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Tabela
-- ---------------------------------------------------------------------------
DROP TABLE "clients";

-- ---------------------------------------------------------------------------
-- 5. Reconstrução do que dependia de `client_id`
-- ---------------------------------------------------------------------------
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_store_id_fkey"
  FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A invariante "no máximo uma assinatura ativa" era garantida por
-- `subscriptions_client_id_active_unique_idx`, que o DROP COLUMN acima levou embora.
-- Recriada por loja — sem isto a loja poderia ser cobrada duas vezes, e o banco não
-- reclamaria.
CREATE UNIQUE INDEX "subscriptions_store_id_active_unique_idx"
  ON "subscriptions"("store_id")
  WHERE "status" IN ('ACTIVE', 'TRIALING');
