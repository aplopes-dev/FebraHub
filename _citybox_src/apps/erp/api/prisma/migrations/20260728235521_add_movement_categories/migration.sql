-- CreateEnum
CREATE TYPE "MovementCategoryType" AS ENUM ('entrada', 'saida');

-- CreateTable
CREATE TABLE "movement_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MovementCategoryType" NOT NULL,
    "system_key" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movement_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_category_branches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "movement_category_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movement_category_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "movement_categories_organization_id_idx" ON "movement_categories"("organization_id");

-- CreateIndex
CREATE INDEX "movement_categories_organization_id_type_idx" ON "movement_categories"("organization_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "movement_categories_organization_id_code_key" ON "movement_categories"("organization_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "movement_categories_organization_id_system_key_key" ON "movement_categories"("organization_id", "system_key");

-- CreateIndex
CREATE UNIQUE INDEX "movement_categories_id_organization_id_key" ON "movement_categories"("id", "organization_id");

-- CreateIndex
CREATE INDEX "movement_category_branches_organization_id_idx" ON "movement_category_branches"("organization_id");

-- CreateIndex
CREATE INDEX "movement_category_branches_branch_id_idx" ON "movement_category_branches"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "movement_category_branches_movement_category_id_branch_id_key" ON "movement_category_branches"("movement_category_id", "branch_id");

-- AddForeignKey
ALTER TABLE "movement_categories" ADD CONSTRAINT "movement_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_category_branches" ADD CONSTRAINT "movement_category_branches_movement_category_id_organizati_fkey" FOREIGN KEY ("movement_category_id", "organization_id") REFERENCES "movement_categories"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_category_branches" ADD CONSTRAINT "movement_category_branches_branch_id_organization_id_fkey" FOREIGN KEY ("branch_id", "organization_id") REFERENCES "branches"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;
