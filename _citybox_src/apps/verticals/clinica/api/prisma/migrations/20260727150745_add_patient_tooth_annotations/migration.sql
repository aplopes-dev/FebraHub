-- CreateTable
CREATE TABLE "patient_tooth_annotations" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "tooth_number" INTEGER NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "professional_id" TEXT NOT NULL DEFAULT '',
    "professional_name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_tooth_annotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_tooth_annotations_store_id_patient_id_idx" ON "patient_tooth_annotations"("store_id", "patient_id");

-- CreateIndex
CREATE INDEX "patient_tooth_annotations_store_id_patient_id_tooth_number_idx" ON "patient_tooth_annotations"("store_id", "patient_id", "tooth_number");

-- AddForeignKey
ALTER TABLE "patient_tooth_annotations" ADD CONSTRAINT "patient_tooth_annotations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
