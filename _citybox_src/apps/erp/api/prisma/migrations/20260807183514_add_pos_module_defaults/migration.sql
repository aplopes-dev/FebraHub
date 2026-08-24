-- AlterTable
ALTER TABLE "pos_terminals" ADD COLUMN     "module_overrides" JSONB;

-- CreateTable
CREATE TABLE "pos_module_defaults" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "profile_name" TEXT,
    "modules" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pos_module_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_module_defaults_organization_id_key" ON "pos_module_defaults"("organization_id");

-- AddForeignKey
ALTER TABLE "pos_module_defaults" ADD CONSTRAINT "pos_module_defaults_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
