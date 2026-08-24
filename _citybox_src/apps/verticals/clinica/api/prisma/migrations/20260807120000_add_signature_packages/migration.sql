-- Manual apply: always run with search_path = clinica
SET search_path TO clinica;

-- CreateEnum (pending | liberado | cancelado)
CREATE TYPE "SignaturePackageRequestStatus" AS ENUM ('pending', 'liberado', 'cancelado');

-- CreateTable
CREATE TABLE "signature_credit_balances" (
    "store_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "signature_credit_balances_pkey" PRIMARY KEY ("store_id"),
    CONSTRAINT "balance_non_negative" CHECK ("balance" >= 0)
);

-- CreateTable
CREATE TABLE "signature_package_requests" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "status" "SignaturePackageRequestStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liberated_at" TIMESTAMPTZ(3),

    CONSTRAINT "signature_package_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signature_package_requests_store_id_status_idx" ON "signature_package_requests"("store_id", "status");
