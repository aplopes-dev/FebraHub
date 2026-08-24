-- CreateEnum
CREATE TYPE "PosTerminalStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "pos_terminals" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PosTerminalStatus" NOT NULL DEFAULT 'active',
    "printer" TEXT,
    "scale" TEXT,
    "nfce_contingency" BOOLEAN NOT NULL DEFAULT false,
    "offline_server_id" TEXT,
    "pairing_code" TEXT,
    "pairing_code_expires_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_terminals_organization_id_idx" ON "pos_terminals"("organization_id");

-- CreateIndex
CREATE INDEX "pos_terminals_organization_id_branch_id_idx" ON "pos_terminals"("organization_id", "branch_id");

-- CreateIndex
CREATE INDEX "pos_terminals_organization_id_deleted_at_idx" ON "pos_terminals"("organization_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_id_organization_id_key" ON "pos_terminals"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
