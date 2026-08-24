-- CreateTable
CREATE TABLE "dashboard_sales_goals" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "goal_cents" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_sales_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboard_sales_goals_store_id_created_at_idx" ON "dashboard_sales_goals"("store_id", "created_at" DESC);
