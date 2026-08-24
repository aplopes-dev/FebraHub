-- T014 — remove o provider municipal de Ilhéus do enum.
--
-- O município aderiu ao Padrão Nacional (Decreto Municipal nº 220/2026), e a
-- NFS-e passou a sair pelo `SEFIN_NACIONAL`. O provider municipal nunca chegou
-- a ser registrado em nenhum módulo — era código morto desde a adesão.
--
-- ⚠️ Postgres não permite remover valor de enum: é preciso recriar o tipo.
-- A guarda abaixo faz a migration FALHAR COM MENSAGEM CLARA se algum ambiente
-- tiver documentos usando o valor, em vez de quebrar com erro de cast no meio
-- da troca. Preferível parar e decidir a migrar dado fiscal por engano.
DO $$
DECLARE
  usados integer;
BEGIN
  SELECT count(*) INTO usados
  FROM "fiscal"."fiscal_documents"
  WHERE "provider"::text = 'ILHEUS_METROPOLIS_NFSE';

  IF usados > 0 THEN
    RAISE EXCEPTION
      'Existem % documentos com provider ILHEUS_METROPOLIS_NFSE. Migre-os antes de remover o valor do enum.',
      usados;
  END IF;
END $$;

ALTER TYPE "fiscal"."ProviderType" RENAME TO "ProviderType_old";

CREATE TYPE "fiscal"."ProviderType" AS ENUM ('SEFAZ_BA_NFE', 'SEFIN_NACIONAL');

ALTER TABLE "fiscal"."fiscal_documents"
  ALTER COLUMN "provider" TYPE "fiscal"."ProviderType"
  USING ("provider"::text::"fiscal"."ProviderType");

ALTER TABLE "fiscal"."provider_requests"
  ALTER COLUMN "provider" TYPE "fiscal"."ProviderType"
  USING ("provider"::text::"fiscal"."ProviderType");

DROP TYPE "fiscal"."ProviderType_old";
