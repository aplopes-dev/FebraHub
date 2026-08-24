-- CreateEnum
CREATE TYPE "PosCashSessionStatus" AS ENUM ('open', 'closed');

-- CreateEnum
CREATE TYPE "PosCashMovementType" AS ENUM ('withdrawal', 'reinforcement');

-- AlterTable
ALTER TABLE "sale_orders" ADD COLUMN     "cash_session_id" TEXT,
ADD COLUMN     "operator_user_id" TEXT,
ADD COLUMN     "pos_terminal_id" TEXT;

-- CreateTable
CREATE TABLE "pos_cash_sessions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "pos_terminal_id" TEXT NOT NULL,
    "status" "PosCashSessionStatus" NOT NULL DEFAULT 'open',
    "opened_at" TIMESTAMPTZ(3) NOT NULL,
    "closed_at" TIMESTAMPTZ(3),
    "opened_by_user_id" TEXT NOT NULL,
    "opened_by_name" TEXT NOT NULL,
    "opening_float_cents" INTEGER NOT NULL,
    "counted_cash_cents" INTEGER,
    "counted_credit_cents" INTEGER,
    "counted_debit_cents" INTEGER,
    "counted_voucher_cents" INTEGER,
    "counted_other_cents" INTEGER,
    "expected_cash_cents" INTEGER,
    "difference_cash_cents" INTEGER,
    "declared_receipts_cents" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pos_cash_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_cash_movements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "PosCashMovementType" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "operation" TEXT NOT NULL,
    "operator_user_id" TEXT NOT NULL,
    "operator_name" TEXT NOT NULL,
    "authorized_by_user_id" TEXT,
    "authorized_by_name" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_cash_sessions_organization_id_opened_at_idx" ON "pos_cash_sessions"("organization_id", "opened_at");

-- CreateIndex
CREATE INDEX "pos_cash_sessions_organization_id_status_idx" ON "pos_cash_sessions"("organization_id", "status");

-- CreateIndex
CREATE INDEX "pos_cash_sessions_pos_terminal_id_status_idx" ON "pos_cash_sessions"("pos_terminal_id", "status");

-- CreateIndex
CREATE INDEX "pos_cash_sessions_opened_by_user_id_idx" ON "pos_cash_sessions"("opened_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_cash_sessions_id_organization_id_key" ON "pos_cash_sessions"("id", "organization_id");

-- CreateIndex
CREATE INDEX "pos_cash_movements_session_id_created_at_idx" ON "pos_cash_movements"("session_id", "created_at");

-- CreateIndex
CREATE INDEX "pos_cash_movements_organization_id_idx" ON "pos_cash_movements"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "pos_cash_movements_id_organization_id_key" ON "pos_cash_movements"("id", "organization_id");

-- CreateIndex
CREATE INDEX "sale_orders_cash_session_id_idx" ON "sale_orders"("cash_session_id");

-- CreateIndex
CREATE INDEX "sale_orders_pos_terminal_id_idx" ON "sale_orders"("pos_terminal_id");

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_pos_terminal_id_organization_id_fkey" FOREIGN KEY ("pos_terminal_id", "organization_id") REFERENCES "pos_terminals"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_cash_session_id_organization_id_fkey" FOREIGN KEY ("cash_session_id", "organization_id") REFERENCES "pos_cash_sessions"("id", "organization_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_sessions" ADD CONSTRAINT "pos_cash_sessions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_sessions" ADD CONSTRAINT "pos_cash_sessions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_sessions" ADD CONSTRAINT "pos_cash_sessions_pos_terminal_id_organization_id_fkey" FOREIGN KEY ("pos_terminal_id", "organization_id") REFERENCES "pos_terminals"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_session_id_organization_id_fkey" FOREIGN KEY ("session_id", "organization_id") REFERENCES "pos_cash_sessions"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- No máximo uma sessão open por terminal
CREATE UNIQUE INDEX "pos_cash_sessions_one_open_per_terminal"
ON "pos_cash_sessions" ("pos_terminal_id")
WHERE "status" = 'open';
