/*
  Warnings:

  - You are about to drop the column `address` on the `store_settings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ClientCategoryColorId" AS ENUM ('blue', 'green', 'purple', 'orange', 'red', 'pink', 'teal', 'amber', 'indigo', 'lime');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "category_id" TEXT;

-- AlterTable
ALTER TABLE "client_categories" ADD COLUMN     "color_id" "ClientCategoryColorId" NOT NULL DEFAULT 'blue',
ADD COLUMN     "is_protected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "store_settings" DROP COLUMN "address",
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "communications_name" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logo_mime_type" TEXT,
ADD COLUMN     "logo_object_key" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "number" TEXT,
ADD COLUMN     "responsible" TEXT,
ADD COLUMN     "state" VARCHAR(2),
ADD COLUMN     "street" TEXT;

-- CreateTable
CREATE TABLE "appointment_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'blue',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "appointment_categories_name_key" ON "appointment_categories"("name");

-- CreateIndex
CREATE INDEX "appointments_category_id_idx" ON "appointments"("category_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "appointment_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
