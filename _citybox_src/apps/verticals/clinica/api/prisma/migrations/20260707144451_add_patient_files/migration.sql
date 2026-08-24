-- CreateEnum
CREATE TYPE "PatientFileKind" AS ENUM ('image', 'file');

-- CreateTable
CREATE TABLE "patient_folders" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "patient_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_files" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "folder_id" TEXT,
    "name" TEXT NOT NULL,
    "object_key" VARCHAR(512) NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "kind" "PatientFileKind" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_folders_store_id_patient_id_parent_id_idx" ON "patient_folders"("store_id", "patient_id", "parent_id");

-- CreateIndex
CREATE INDEX "patient_files_store_id_patient_id_folder_id_idx" ON "patient_files"("store_id", "patient_id", "folder_id");

-- AddForeignKey
ALTER TABLE "patient_folders" ADD CONSTRAINT "patient_folders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_folders" ADD CONSTRAINT "patient_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "patient_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_files" ADD CONSTRAINT "patient_files_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_files" ADD CONSTRAINT "patient_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "patient_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
