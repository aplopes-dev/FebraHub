-- AlterTable
ALTER TABLE "products" ADD COLUMN     "available_on_erp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "available_on_pdv" BOOLEAN NOT NULL DEFAULT true;
