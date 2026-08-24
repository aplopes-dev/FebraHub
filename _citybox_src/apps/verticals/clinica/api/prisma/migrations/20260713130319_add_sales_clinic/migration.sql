-- CreateEnum
CREATE TYPE "SalesFunnelStageType" AS ENUM ('others', 'won', 'lost');

-- CreateEnum
CREATE TYPE "SalesOpportunityHistoryAction" AS ENUM ('created', 'moved', 'comment', 'label_changed', 'contact_scheduled', 'updated');

-- CreateEnum
CREATE TYPE "SalesOpportunityOrigin" AS ENUM ('instagram', 'facebook', 'google', 'whatsapp', 'site', 'indicacao', 'retorno', 'campaign', 'outro');

-- CreateTable
CREATE TABLE "sales_funnels" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sales_funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_funnel_stages" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SalesFunnelStageType" NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sales_funnel_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_labels" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sales_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_opportunities" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phone" VARCHAR(32),
    "origin" "SalesOpportunityOrigin",
    "next_contact" TIMESTAMPTZ(3),
    "patient_id" TEXT,
    "label_id" TEXT,
    "submission_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "last_interaction_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sales_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_opportunity_history" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "action_type" "SalesOpportunityHistoryAction" NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "user_avatar" TEXT,
    "content" TEXT,
    "metadata" JSONB,
    "is_system_action" BOOLEAN NOT NULL DEFAULT false,
    "system_name" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_opportunity_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_funnels_store_id_idx" ON "sales_funnels"("store_id");

-- CreateIndex
CREATE INDEX "sales_funnels_store_id_is_default_idx" ON "sales_funnels"("store_id", "is_default");

-- CreateIndex
CREATE INDEX "sales_funnel_stages_store_id_idx" ON "sales_funnel_stages"("store_id");

-- CreateIndex
CREATE INDEX "sales_funnel_stages_funnel_id_idx" ON "sales_funnel_stages"("funnel_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_funnel_stages_funnel_id_order_key" ON "sales_funnel_stages"("funnel_id", "order");

-- CreateIndex
CREATE INDEX "sales_labels_store_id_idx" ON "sales_labels"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_labels_store_id_name_key" ON "sales_labels"("store_id", "name");

-- CreateIndex
CREATE INDEX "sales_opportunities_store_id_idx" ON "sales_opportunities"("store_id");

-- CreateIndex
CREATE INDEX "sales_opportunities_store_id_funnel_id_idx" ON "sales_opportunities"("store_id", "funnel_id");

-- CreateIndex
CREATE INDEX "sales_opportunities_store_id_stage_id_idx" ON "sales_opportunities"("store_id", "stage_id");

-- CreateIndex
CREATE INDEX "sales_opportunities_store_id_stage_id_sort_order_idx" ON "sales_opportunities"("store_id", "stage_id", "sort_order");

-- CreateIndex
CREATE INDEX "sales_opportunities_store_id_patient_id_idx" ON "sales_opportunities"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "sales_opportunities_store_id_label_id_idx" ON "sales_opportunities"("store_id", "label_id");

-- CreateIndex
CREATE INDEX "sales_opportunity_history_store_id_idx" ON "sales_opportunity_history"("store_id");

-- CreateIndex
CREATE INDEX "sales_opportunity_history_opportunity_id_created_at_idx" ON "sales_opportunity_history"("opportunity_id", "created_at");

-- AddForeignKey
ALTER TABLE "sales_funnel_stages" ADD CONSTRAINT "sales_funnel_stages_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "sales_funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "sales_funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "sales_funnel_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunities" ADD CONSTRAINT "sales_opportunities_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "sales_labels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_opportunity_history" ADD CONSTRAINT "sales_opportunity_history_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "sales_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
