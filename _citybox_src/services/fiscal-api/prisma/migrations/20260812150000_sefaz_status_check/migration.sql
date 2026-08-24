-- CreateTable
CREATE TABLE "fiscal"."sefaz_status_check" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "company_id" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "authority_message" TEXT,
    "expected_return_at" TIMESTAMP(3),
    "checked_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sefaz_status_check_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sefaz_status_check_company_id_model_environment_checked_at_idx" ON "fiscal"."sefaz_status_check"("company_id", "model", "environment", "checked_at" DESC);
