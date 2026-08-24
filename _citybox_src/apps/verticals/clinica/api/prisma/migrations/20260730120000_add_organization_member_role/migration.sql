-- CreateEnum
CREATE TYPE "OrganizationMemberRole" AS ENUM ('OWNER', 'COLLABORATOR');

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "organization_role" "OrganizationMemberRole" NOT NULL DEFAULT 'COLLABORATOR';

-- CreateIndex
CREATE INDEX "members_organization_id_organization_role_idx" ON "members"("organization_id", "organization_role");

-- CreateIndex
-- Invariante "no máximo um responsável por organização" no banco, e não só no use case:
-- o provisionamento roda a partir de um evento com entrega at-least-once, então duas
-- entregas simultâneas do mesmo `store.created` poderiam passar juntas pela checagem em
-- memória. O índice é PARCIAL (`WHERE`) por dois motivos que o Prisma não sabe modelar —
-- por isso este bloco é escrito à mão e não sai do `migrate diff`:
--   1. só vale para OWNER: colaboradores são muitos por organização;
--   2. ignora removidos: `softDelete` mantém a linha (o id é referenciado por
--      agendamentos e comissões sem FK), e um responsável já removido não pode
--      impedir que um novo assuma.
CREATE UNIQUE INDEX "members_one_owner_per_organization"
  ON "members"("organization_id")
  WHERE "organization_role" = 'OWNER' AND "deleted_at" IS NULL;
