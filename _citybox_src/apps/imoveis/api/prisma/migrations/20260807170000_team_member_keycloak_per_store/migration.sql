-- Um mesmo usuário Keycloak pode ser responsável/membro em N lojas Imóveis.
-- Unique global em keycloak_sub/username bloqueava o 2º store-setup do mesmo e-mail.

DROP INDEX IF EXISTS "imoveis"."team_members_keycloak_sub_key";
DROP INDEX IF EXISTS "imoveis"."team_members_username_key";

CREATE UNIQUE INDEX "team_members_store_id_keycloak_sub_key"
  ON "imoveis"."team_members"("store_id", "keycloak_sub");

CREATE UNIQUE INDEX "team_members_store_id_username_key"
  ON "imoveis"."team_members"("store_id", "username");
