-- CreateEnum
CREATE TYPE "ServiceOrderStatusVariant" AS ENUM ('default', 'secondary', 'outline', 'destructive');

-- AlterTable
-- Escrita à mão (não via `prisma migrate dev`) porque o diff engine do
-- Prisma queria dropar+recriar a coluna `variant` (perda de dado) ao trocar
-- de TEXT para enum; aqui o cast `USING` preserva os valores existentes
-- ('secondary', único valor gravado até agora pelo default da migration
-- anterior). Revisado pelo database-reviewer antes de aplicar.
ALTER TABLE "service_order_statuses" ALTER COLUMN "variant" DROP DEFAULT;
ALTER TABLE "service_order_statuses" ALTER COLUMN "variant" TYPE "ServiceOrderStatusVariant" USING ("variant"::"ServiceOrderStatusVariant");
ALTER TABLE "service_order_statuses" ALTER COLUMN "variant" SET DEFAULT 'secondary';
