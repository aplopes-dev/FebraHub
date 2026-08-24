-- 1. Criar o novo Enum
CREATE TYPE "StoreStatus" AS ENUM ('IN_SETUP', 'TRAINING', 'PRODUCTION', 'BLOCKED', 'OFFLINE');

-- 2. Adicionar nova coluna temporária
ALTER TABLE "stores" ADD COLUMN "status_new" "StoreStatus";

-- 3. Mapear os dados existentes para o novo enum
UPDATE "stores" SET "status_new" = 
  CASE 
    -- Mapeamento do campo 'status' (antigo)
    WHEN "status" = 'ativa' THEN 'PRODUCTION'::"StoreStatus"
    WHEN "status" = 'bloqueada' THEN 'BLOCKED'::"StoreStatus"
    WHEN "status" = 'em_implantacao' THEN 'IN_SETUP'::"StoreStatus"
    WHEN "status" = 'offline' THEN 'OFFLINE'::"StoreStatus"

    
    -- Mapeamento do campo 'deployment_status' se 'status' for NULL ou não mapeado
    WHEN "deployment_status" = 'em_setup' THEN 'IN_SETUP'::"StoreStatus"
    WHEN "deployment_status" = 'em_treinamento' THEN 'TRAINING'::"StoreStatus"
    WHEN "deployment_status" = 'producao' THEN 'PRODUCTION'::"StoreStatus"
    
    -- Fallback para qualquer outro valor
    ELSE 'IN_SETUP'::"StoreStatus"
  END;

-- 4. Tornar a coluna NOT NULL (já que todos foram mapeados)
ALTER TABLE "stores" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "stores" ALTER COLUMN "status_new" SET DEFAULT 'IN_SETUP';

-- 5. Remover colunas antigas e renomear a nova
ALTER TABLE "stores" DROP COLUMN "deployment_status";
ALTER TABLE "stores" DROP COLUMN "status";
ALTER TABLE "stores" RENAME COLUMN "status_new" TO "status";

-- 6. Remover DEFAULT das outras tabelas (mantido da migration original)
ALTER TABLE "invoices" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "plan_prices" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- 7. Remover índice único (mantido da migration original)
DROP INDEX IF EXISTS "invoices_stripe_invoice_id_key";

-- 8. Criar índice para performance
CREATE INDEX "stores_status_idx" ON "stores"("status");