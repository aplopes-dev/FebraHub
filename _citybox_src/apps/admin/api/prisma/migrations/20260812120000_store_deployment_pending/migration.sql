-- Provisionamento sob demanda: a loja nasce PENDING e só vai a PROVISIONING
-- quando o operador clica em Provisionar no admin.
ALTER TYPE "platform"."StoreDeploymentStatus" ADD VALUE IF NOT EXISTS 'PENDING' BEFORE 'PROVISIONING';

ALTER TABLE "platform"."stores"
  ALTER COLUMN "deployment_status" SET DEFAULT 'PENDING';
