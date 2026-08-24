-- CreateTable
CREATE TABLE "patient_body_metrics" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "measured_at" DATE NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "professional_id" TEXT NOT NULL DEFAULT '',
    "professional_name" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_body_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_body_metrics_store_id_patient_id_idx" ON "patient_body_metrics"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_body_metrics_store_id_patient_id_measured_at_idx" ON "patient_body_metrics"("store_id", "patient_id", "measured_at");

-- AddForeignKey
ALTER TABLE "patient_body_metrics" ADD CONSTRAINT "patient_body_metrics_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
