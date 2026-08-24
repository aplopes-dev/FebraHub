-- CreateTable: auditoria da alteração manual do número atual da série (spec erp/011, FR-004)
CREATE TABLE "fiscal"."fiscal_sequence_number_changes" (
    "id" UUID NOT NULL DEFAULT public.citybox_uuid_v7(),
    "sequence_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "previous_number" BIGINT NOT NULL,
    "new_number" BIGINT NOT NULL,
    "changed_by_user_id" TEXT NOT NULL,
    "changed_by_actor" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_sequence_number_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fiscal_sequence_number_changes_sequence_id_changed_at_idx" ON "fiscal"."fiscal_sequence_number_changes"("sequence_id", "changed_at");

-- CreateIndex
CREATE INDEX "fiscal_sequence_number_changes_company_id_changed_at_idx" ON "fiscal"."fiscal_sequence_number_changes"("company_id", "changed_at");
