-- CreateEnum
CREATE TYPE "pos_operator_role" AS ENUM ('operator', 'supervisor');

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "permission_profile_id" TEXT;

-- CreateTable
CREATE TABLE "permission_profiles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "system_key" TEXT,
    "permission_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "permission_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_operators" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "role" "pos_operator_role" NOT NULL DEFAULT 'operator',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "pin_hash" TEXT NOT NULL,
    "pin_updated_at" TIMESTAMPTZ(3),
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pos_operators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permission_profiles_organization_id_idx" ON "permission_profiles"("organization_id");

-- CreateIndex
CREATE INDEX "permission_profiles_organization_id_deleted_at_idx" ON "permission_profiles"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permission_profiles_organization_id_system_key_key" ON "permission_profiles"("organization_id", "system_key");

-- CreateIndex
CREATE INDEX "pos_operators_organization_id_idx" ON "pos_operators"("organization_id");

-- CreateIndex
CREATE INDEX "pos_operators_organization_id_branch_id_idx" ON "pos_operators"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "pos_operators_organization_id_deleted_at_idx" ON "pos_operators"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "pos_operators_id_organization_id_key" ON "pos_operators"("id", "organization_id");

-- CreateIndex
CREATE INDEX "memberships_permission_profile_id_idx" ON "memberships"("permission_profile_id");

-- AddForeignKey
ALTER TABLE "permission_profiles" ADD CONSTRAINT "permission_profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_permission_profile_id_fkey" FOREIGN KEY ("permission_profile_id") REFERENCES "permission_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_operators" ADD CONSTRAINT "pos_operators_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_operators" ADD CONSTRAINT "pos_operators_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
