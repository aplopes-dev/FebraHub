-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'disabled');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "keycloak_sub" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'active',
    "has_password" BOOLEAN NOT NULL DEFAULT false,
    "provisional_expires_at" TIMESTAMPTZ(3),
    "disabled_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_members" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clinic_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_keycloak_sub_key" ON "members"("keycloak_sub");

-- CreateIndex
CREATE UNIQUE INDEX "members_username_key" ON "members"("username");

-- CreateIndex
CREATE INDEX "members_organization_id_idx" ON "members"("organization_id");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");

-- CreateIndex
CREATE INDEX "clinic_members_clinic_id_idx" ON "clinic_members"("clinic_id");

-- CreateIndex
CREATE INDEX "clinic_members_member_id_idx" ON "clinic_members"("member_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_members_clinic_id_member_id_key" ON "clinic_members"("clinic_id", "member_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_members" ADD CONSTRAINT "clinic_members_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_members" ADD CONSTRAINT "clinic_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
