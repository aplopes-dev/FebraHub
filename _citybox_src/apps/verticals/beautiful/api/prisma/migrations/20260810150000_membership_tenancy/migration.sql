-- CreateEnum
CREATE TYPE "beautiful"."OrganizationStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "beautiful"."StoreStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "beautiful"."MemberStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "beautiful"."OrganizationMemberRole" AS ENUM ('OWNER', 'COLLABORATOR');

-- CreateTable
CREATE TABLE "beautiful"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "beautiful"."OrganizationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beautiful"."stores" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "beautiful"."StoreStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beautiful"."members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "keycloak_sub" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "status" "beautiful"."MemberStatus" NOT NULL DEFAULT 'active',
    "organization_role" "beautiful"."OrganizationMemberRole" NOT NULL DEFAULT 'COLLABORATOR',
    "has_password" BOOLEAN NOT NULL DEFAULT false,
    "provisional_expires_at" TIMESTAMP(3),
    "disabled_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beautiful"."store_members" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_members_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "beautiful"."professionals" ADD COLUMN "member_id" TEXT;

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "beautiful"."organizations"("status");

-- CreateIndex
CREATE INDEX "stores_organization_id_idx" ON "beautiful"."stores"("organization_id");

-- CreateIndex
CREATE INDEX "stores_status_idx" ON "beautiful"."stores"("status");

-- CreateIndex
CREATE UNIQUE INDEX "members_keycloak_sub_key" ON "beautiful"."members"("keycloak_sub");

-- CreateIndex
CREATE UNIQUE INDEX "members_username_key" ON "beautiful"."members"("username");

-- CreateIndex
CREATE INDEX "members_organization_id_idx" ON "beautiful"."members"("organization_id");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "beautiful"."members"("status");

-- CreateIndex
CREATE INDEX "store_members_store_id_idx" ON "beautiful"."store_members"("store_id");

-- CreateIndex
CREATE INDEX "store_members_member_id_idx" ON "beautiful"."store_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_members_store_id_member_id_key" ON "beautiful"."store_members"("store_id", "member_id");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_member_id_key" ON "beautiful"."professionals"("member_id");

-- AddForeignKey
ALTER TABLE "beautiful"."stores" ADD CONSTRAINT "stores_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "beautiful"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beautiful"."members" ADD CONSTRAINT "members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "beautiful"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beautiful"."store_members" ADD CONSTRAINT "store_members_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "beautiful"."stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beautiful"."store_members" ADD CONSTRAINT "store_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "beautiful"."members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beautiful"."professionals" ADD CONSTRAINT "professionals_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "beautiful"."members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
