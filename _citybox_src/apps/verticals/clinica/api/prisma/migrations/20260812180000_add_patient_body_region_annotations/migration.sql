-- CreateTable
CREATE TABLE "patient_body_region_annotations" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "body_region_id" VARCHAR(64) NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "professional_id" TEXT NOT NULL DEFAULT '',
    "professional_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_body_region_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_body_region_annotations_store_id_patient_id_idx" ON "patient_body_region_annotations"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_body_region_annotations_store_id_patient_id_body_region_id_idx" ON "patient_body_region_annotations"("store_id", "patient_id", "body_region_id");

-- AddForeignKey
ALTER TABLE "patient_body_region_annotations" ADD CONSTRAINT "patient_body_region_annotations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
