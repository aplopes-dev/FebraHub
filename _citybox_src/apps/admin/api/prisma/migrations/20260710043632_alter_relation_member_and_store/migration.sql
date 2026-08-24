-- DropIndex
DROP INDEX "store_members_store_id_keycloak_sub_key";

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "keycloak_sub" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "has_password" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- Copiar os dados existentes da tabela store_members para a tabela members antes de remover as colunas
INSERT INTO "members" (
    "id",
    "client_id",
    "keycloak_sub",
    "username",
    "email",
    "first_name",
    "last_name",
    "has_password",
    "created_at",
    "updated_at"
)
SELECT DISTINCT ON (sm.keycloak_sub)
    gen_random_uuid()::text,
    s.client_id,
    sm.keycloak_sub,
    sm.username,
    COALESCE(NULLIF(sm.email, ''), sm.username || '@placeholder.citybox.com'),
    sm.first_name,
    sm.last_name,
    sm.has_password,
    sm.created_at,
    sm.updated_at
FROM "store_members" sm
JOIN "stores" s ON s.id = sm.store_id;

-- Adicionar a coluna member_id temporariamente como nullable
ALTER TABLE "store_members" ADD COLUMN "member_id" TEXT;

-- Mapear os member_id com base nos registros inseridos em members
UPDATE "store_members" sm
SET "member_id" = m.id
FROM "members" m
WHERE sm.keycloak_sub = m.keycloak_sub;

-- Tornar a coluna member_id obrigatória (NOT NULL)
ALTER TABLE "store_members" ALTER COLUMN "member_id" SET NOT NULL;

-- Remover as colunas antigas de store_members
ALTER TABLE "store_members" 
DROP COLUMN "email",
DROP COLUMN "first_name",
DROP COLUMN "has_password",
DROP COLUMN "keycloak_sub",
DROP COLUMN "last_name",
DROP COLUMN "username";

-- CreateIndex
CREATE UNIQUE INDEX "members_keycloak_sub_key" ON "members"("keycloak_sub");

-- CreateIndex
CREATE UNIQUE INDEX "members_username_key" ON "members"("username");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "store_members_member_id_idx" ON "store_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_members_store_id_member_id_key" ON "store_members"("store_id", "member_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

