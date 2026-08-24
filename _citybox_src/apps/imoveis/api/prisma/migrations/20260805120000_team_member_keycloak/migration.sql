-- AlterTable: vincular TeamMember ao Keycloak (sub + username + hasPassword)
ALTER TABLE "imoveis"."team_members"
  ADD COLUMN "keycloak_sub" TEXT,
  ADD COLUMN "username" TEXT,
  ADD COLUMN "has_password" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "team_members_keycloak_sub_key" ON "imoveis"."team_members"("keycloak_sub");
CREATE UNIQUE INDEX "team_members_username_key" ON "imoveis"."team_members"("username");
